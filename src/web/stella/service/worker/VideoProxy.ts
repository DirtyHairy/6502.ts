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

import { Event } from 'microevent.ts';

import VideoEndpointInterface from '../../../driver/VideoEndpointInterface';
import { RpcProviderInterface } from 'worker-rpc';
import PoolMemberInterface from '../../../../tools/pool/PoolMemberInterface';
import Pool from '../../../../tools/pool/Pool';

import {
    SIGNAL_TYPE,
    RPC_TYPE,
    VideoNewFrameMessage,
    VideoReturnSurfaceMessage,
    VideoParametersResponse
} from './messages';

class VideoProxy implements VideoEndpointInterface {
    constructor(private _rpc: RpcProviderInterface) {
        this._framePool.event.release.addHandler(VideoProxy._onDisposeFrame, this);
    }

    init(): void {
        this._rpc.registerSignalHandler(SIGNAL_TYPE.videoNewFrame, this._onNewFrame.bind(this));
    }

    async start(): Promise<void> {
        if (this._active) {
            this.stop();
        }

        const videoParameters = await this._rpc.rpc<void, VideoParametersResponse>(RPC_TYPE.getVideoParameters);

        this._active = true;
        this._width = videoParameters.width;
        this._height = videoParameters.height;
        this._frameMap = new WeakMap<ImageData, number>();
    }

    stop(): void {
        this._active = false;
    }

    getWidth(): number {
        return this._width;
    }

    getHeight(): number {
        return this._height;
    }

    private static _onDisposeFrame(imageData: ImageData, self: VideoProxy): void {
        if (!self._active) return;

        if (!self._frameMap.has(imageData)) {
            console.warn('unknown imageData returned to proxy');
            return;
        }

        const id = self._frameMap.get(imageData);
        self._frameMap.delete(imageData);

        self._rpc.signal<VideoReturnSurfaceMessage>(
            SIGNAL_TYPE.videoReturnSurface,
            {
                id,
                buffer: imageData.data.buffer
            },
            [imageData.data.buffer]
        );
    }

    private _onNewFrame(message: VideoNewFrameMessage): void {
        if (!this._active) {
            console.warn('video proxy deactivated: ignoring frame');
            return;
        }

        if (this._width !== message.width || this._height !== message.height) {
            console.warn(`surface dimensions do not match; ignoring frame`);
            return;
        }

        const frame = this._framePool.get();
        const imageData = new ImageData(new Uint8ClampedArray(message.buffer), message.width, message.height);

        frame.adopt(imageData);
        this._frameMap.set(imageData, message.id);

        this.newFrame.dispatch(frame);
    }

    newFrame = new Event<PoolMemberInterface<ImageData>>();

    private _framePool = new Pool<ImageData>(() => null);
    private _frameMap: WeakMap<ImageData, number> = null;

    private _active = false;
    private _width = 0;
    private _height = 0;
}

export { VideoProxy as default };
