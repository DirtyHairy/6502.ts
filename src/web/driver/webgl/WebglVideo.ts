/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript
 *
 *   Copyright (c) 2014 -- 2020 Christian Speckner and contributors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

import VideoEndpointInterface from '../VideoEndpointInterface';
import { fsh, vsh } from './shader';
import Program from './Program';
import PoolMemberInterface from '../../../tools/pool/PoolMemberInterface';
import PhosphorProcessor from './PhosphorProcessor';
import NtscProcessor from './NtscProcessor';
import ScanlineProcessor from './ScanlineProcessor';
import IntegerScalingProcessor from './IntegerScalingProcessor';
import RingBuffer from '../../../tools/RingBuffer';

const MAX_CONSECUTIVE_UNDERFLOWS = 5;

class WebglVideo {
    constructor(private _canvas: HTMLCanvasElement, config: Partial<WebglVideo.Config> = {}) {
        const defaultConfig: WebglVideo.Config = {
            gamma: 1,
            scalingMode: WebglVideo.ScalingMode.qis,
            phosphorLevel: 0.5,
            scanlineLevel: 0.3
        };

        this._config = {
            ...defaultConfig,
            ...config
        };

        this._gl = this._canvas.getContext('webgl');

        if (!this._gl) {
            this._gl = this._canvas.getContext('experimental-webgl') as any;
        }

        if (!this._gl) {
            throw new Error('unable to acquire webgl context');
        }

        this._phosphorProcessor = new PhosphorProcessor(this._gl);
        this._ntscProcessor = new NtscProcessor(this._gl);
        this._scanlineProcessor = new ScanlineProcessor(this._gl);
        this._integerScalingProcessor = new IntegerScalingProcessor(this._gl);
    }

    init(): this {
        this.close();

        this._updateCanvasSize();

        this._mainProgram = Program.compile(this._gl, vsh.plain.source, fsh.blitWithGamma.source);

        this._mainProgram.use();
        this._mainProgram.uniform1i(fsh.blitWithGamma.uniform.textureUnit, 0);
        this._mainProgram.uniform1f(fsh.blitWithGamma.uniform.gamma, this._config.gamma);

        this._createVertexCoordinateBuffer();
        this._createTextureCoordinateBuffer();
        this._configureSourceTexture();

        this._phosphorProcessor.init();
        this._ntscProcessor.init();
        this._scanlineProcessor.init();
        this._integerScalingProcessor.init();

        this._initialized = true;

        return this;
    }

    close(): this {
        if (!this._initialized) {
            return this;
        }

        const gl = this._gl;

        this._mainProgram.delete();
        gl.deleteBuffer(this._vertexCoordinateBuffer);
        gl.deleteBuffer(this._textureCoordinateBuffer);
        gl.deleteTexture(this._sourceTexture);

        return this;
    }

    resize(width?: number, height?: number): this {
        this._updateCanvasSize(width, height);
        this._updateVertexBuffer();

        if (this._video) {
            this._configureProcessors();
            this._scheduleDraw();
        }

        return this;
    }

    getCanvas(): HTMLCanvasElement {
        return this._canvas;
    }

    bind(video: VideoEndpointInterface): this {
        if (this._video) {
            return this;
        }

        this._video = video;
        this._video.newFrame.addHandler(WebglVideo._frameHandler, this);

        this._configureProcessors();

        this._scheduleDraw();

        return this;
    }

    unbind(): this {
        if (!this._video) {
            return this;
        }

        this._cancelDraw();
        this._video.newFrame.removeHandler(WebglVideo._frameHandler, this);
        this._video = null;

        this._pendingFrames.forEach(f => f.release());
        this._pendingFrames.clear();

        return this;
    }

    getConfig(): WebglVideo.Config {
        return this._config;
    }

    updateConfig(config: Partial<WebglVideo.Config>): this {
        return this;
    }

    private static _frameHandler(imageDataPoolMember: PoolMemberInterface<ImageData>, self: WebglVideo): void {
        if (!self._initialized) {
            return;
        }

        if (self._pendingFrames.size() === self._pendingFrames.capacity()) {
            self._pendingFrames.forEach(f => f.release());
            self._pendingFrames.clear();
        }

        self._pendingFrames.push(imageDataPoolMember);

        self._scheduleDraw();
    }

    private _scheduleDraw(): void {
        if (this._anmiationFrameHandle !== 0) {
            return;
        }

        this._anmiationFrameHandle = requestAnimationFrame(() => this._draw());
    }

    private _cancelDraw(): void {
        if (this._anmiationFrameHandle !== 0) {
            cancelAnimationFrame(this._anmiationFrameHandle);
        }

        this._anmiationFrameHandle = 0;
    }

    private _draw(): void {
        const gl = this._gl;
        this._anmiationFrameHandle = 0;

        if (!this._initialized || this._pendingFrames.size() === 0) {
            if (this._consecutiveUnderflows++ <= MAX_CONSECUTIVE_UNDERFLOWS) {
                this._scheduleDraw();
            }

            return;
        }

        this._consecutiveUnderflows = 0;
        this._scheduleDraw();

        const frame = this._pendingFrames.pop();

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._sourceTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame.get());

        frame.release();

        this._ntscProcessor.render(this._sourceTexture);
        this._phosphorProcessor.render(this._ntscProcessor.getTexture());
        this._scanlineProcessor.render(this._phosphorProcessor.getTexture());
        this._integerScalingProcessor.render(this._scanlineProcessor.getTexture());

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._integerScalingProcessor.getTexture());

        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MIN_FILTER,
            this._config.scalingMode === WebglVideo.ScalingMode.none ? gl.NEAREST : gl.LINEAR
        );
        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MAG_FILTER,
            this._config.scalingMode === WebglVideo.ScalingMode.none ? gl.NEAREST : gl.LINEAR
        );

        this._mainProgram.use();
        this._mainProgram.bindVertexAttribArray(
            vsh.plain.attribute.vertexPosition,
            this._vertexCoordinateBuffer,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        this._mainProgram.bindVertexAttribArray(
            vsh.plain.attribute.textureCoordinate,
            this._textureCoordinateBuffer,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this._canvas.width, this._canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    private _createVertexCoordinateBuffer(): void {
        const gl = this._gl,
            targetWidth = this._canvas.width,
            targetHeight = this._canvas.height,
            scaleX = targetWidth > 0 ? 2 / targetWidth : 1,
            scaleY = targetHeight > 0 ? 2 / targetHeight : 1;

        let width: number, height: number, west: number, north: number;

        if ((4 / 3) * targetHeight <= targetWidth) {
            height = 2;
            width = (4 / 3) * targetHeight * scaleX;
            north = 1;
            west = (Math.floor((-4 / 3) * targetHeight) / 2) * scaleX;
        } else {
            height = (targetWidth / (4 / 3)) * scaleY;
            width = 2;
            north = (Math.floor(targetWidth / (4 / 3)) / 2) * scaleY;
            west = -1;
        }

        const vertexData = [west + width, north, west, north, west + width, north - height, west, north - height];

        this._vertexCoordinateBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
    }

    private _updateVertexBuffer(): void {
        if (!this._initialized) {
            return;
        }

        this._gl.deleteBuffer(this._vertexCoordinateBuffer);
        this._createVertexCoordinateBuffer();
    }

    private _createTextureCoordinateBuffer(): void {
        const gl = this._gl;
        const textureCoordinateData = [1, 1, 0, 1, 1, 0, 0, 0];

        this._textureCoordinateBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._textureCoordinateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinateData), gl.STATIC_DRAW);
    }

    private _updateCanvasSize(width?: number, height?: number): void {
        if (typeof width === 'undefined' || typeof height === 'undefined') {
            width = this._canvas.clientWidth;
            height = this._canvas.clientHeight;
        }

        const pixelRatio = window.devicePixelRatio || 1;

        this._canvas.width = width * pixelRatio;
        this._canvas.height = height * pixelRatio;
    }

    private _configureSourceTexture(): void {
        const gl = this._gl;

        if (!this._sourceTexture) {
            this._sourceTexture = gl.createTexture();
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._sourceTexture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    }

    private _configureProcessors() {
        if (!this._video) {
            return;
        }

        this._ntscProcessor.configure(this._video.getWidth(), this._video.getHeight());

        this._phosphorProcessor.configure(
            this._ntscProcessor.getWidth(),
            this._ntscProcessor.getHeight(),
            this._config.phosphorLevel
        );

        this._scanlineProcessor.configure(
            this._phosphorProcessor.getWidth(),
            this._phosphorProcessor.getHeight(),
            this._config.scanlineLevel
        );

        this._integerScalingProcessor.configure(
            this._scanlineProcessor.getWidth(),
            this._scanlineProcessor.getHeight(),
            this._canvas.width,
            this._canvas.height
        );
    }

    private _config: WebglVideo.Config = null;
    private _gl: WebGLRenderingContext = null;
    private _video: VideoEndpointInterface = null;

    private _mainProgram: Program = null;
    private _vertexCoordinateBuffer: WebGLBuffer = null;
    private _textureCoordinateBuffer: WebGLBuffer = null;
    private _sourceTexture: WebGLTexture = null;

    private _initialized = false;
    private _anmiationFrameHandle = 0;

    private _phosphorProcessor: PhosphorProcessor = null;
    private _ntscProcessor: NtscProcessor = null;
    private _scanlineProcessor: ScanlineProcessor = null;
    private _integerScalingProcessor: IntegerScalingProcessor = null;

    private _pendingFrames = new RingBuffer<PoolMemberInterface<ImageData>>(3);
    private _consecutiveUnderflows = 0;
}

namespace WebglVideo {
    export const enum ScalingMode {
        qis = 'qis',
        bilinear = 'bilinear',
        none = 'none'
    }

    export interface Config {
        gamma: number;
        scalingMode: ScalingMode;
        phosphorLevel: number;
        scanlineLevel: number;
    }
}

export default WebglVideo;
