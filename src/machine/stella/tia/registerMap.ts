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

export enum registerMapWrite {
    vsync = 0x00,
    vblank = 0x01,
    wsync = 0x02,
    rsync = 0x03,
    nusiz0 = 0x04,
    nusiz1 = 0x05,
    colup0 = 0x06,
    colup1 = 0x07,
    colupf = 0x08,
    colubk = 0x09,
    ctrlpf = 0x0a,
    refp0 = 0x0b,
    refp1 = 0x0c,
    pf0 = 0x0d,
    pf1 = 0x0e,
    pf2 = 0x0f,
    resp0 = 0x10,
    resp1 = 0x11,
    resm0 = 0x12,
    resm1 = 0x13,
    resbl = 0x14,
    audc0 = 0x15,
    audc1 = 0x16,
    audf0 = 0x17,
    audf1 = 0x18,
    audv0 = 0x19,
    audv1 = 0x1a,
    grp0 = 0x1b,
    grp1 = 0x1c,
    enam0 = 0x1d,
    enam1 = 0x1e,
    enabl = 0x1f,
    hmp0 = 0x20,
    hmp1 = 0x21,
    hmm0 = 0x22,
    hmm1 = 0x23,
    hmbl = 0x24,
    vdelp0 = 0x25,
    vdelp1 = 0x26,
    vdelbl = 0x27,
    resmp0 = 0x28,
    resmp1 = 0x29,
    hmove = 0x2a,
    hmclr = 0x2b,
    cxclr = 0x2c
}
