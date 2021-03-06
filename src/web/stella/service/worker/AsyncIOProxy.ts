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

import AsyncIOInterface from '../../../../machine/io/AsyncIOInterface';
import { RpcProviderInterface } from 'worker-rpc';
import { SIGNAL_TYPE, MessageToAsyncIOMessage } from './messages';
import { Event } from 'microevent.ts';

class AsyncIOProxy implements AsyncIOInterface {
    constructor(private _rpc: RpcProviderInterface) {}

    init(): void {
        this._rpc.registerSignalHandler<Array<number>>(SIGNAL_TYPE.messageFromAsyncIO, data =>
            this.message.dispatch(data)
        );
    }

    send(message: ArrayLike<number>): void {
        this._rpc.signal<MessageToAsyncIOMessage>(SIGNAL_TYPE.messageToAsyncIO, Array.from(message));
    }

    message = new Event<Array<number>>();
}

export default AsyncIOProxy;
