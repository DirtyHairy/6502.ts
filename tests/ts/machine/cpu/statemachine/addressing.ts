/*
 *   This file is part of 6502.ts, an emulator for 6502 based systems built
 *   in Typescript.
 *
 *   Copyright (C) 2014 - 2018 Christian Speckner & contributors
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import { strictEqual } from 'assert';

import { default as Runner, incrementP } from './Runner';
import {
    Immediate,
    ZeroPage,
    Absolute,
    AbsoluteIndexed,
    Indirect,
    ZeroPageIndexed,
    IndexedIndirectX
} from '../../../../../src/machine/cpu/statemachine/addressing';

export default function run() {
    suite('address modes', () => {
        test('immediate', () =>
            Runner.build()
                .read(0x0010, 0x43)
                .result(incrementP)
                .run<Immediate, undefined>(
                    s => ({ ...s, p: 0x0010 }),
                    (state, bus) => new Immediate(state, bus),
                    undefined
                )
                .assert(s => strictEqual(s.operand, 0x43)));

        suite('zeropage', () => {
            test('no dereference', () =>
                Runner.build()
                    .read(0x0010, 0x43)
                    .result(incrementP)
                    .run<ZeroPage, undefined>(
                        s => ({ ...s, p: 0x0010 }),
                        (state, bus) => new ZeroPage(state, bus, false),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x43)));

            test('dereference', () =>
                Runner.build()
                    .read(0x0010, 0x43)
                    .result(incrementP)
                    .read(0x43, 0x66)
                    .run<ZeroPage, undefined>(
                        s => ({ ...s, p: 0x0010 }),
                        (state, bus) => new ZeroPage(state, bus),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x66)));
        });

        suite('absolute', () => {
            test('no dereference', () =>
                Runner.build()
                    .read(0x0010, 0x34)
                    .result(incrementP)
                    .read(0x0011, 0x12)
                    .result(incrementP)
                    .run<Absolute, undefined>(
                        s => ({ ...s, p: 0x0010 }),
                        (state, bus) => new Absolute(state, bus, false),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x1234)));

            test('dereference', () =>
                Runner.build()
                    .read(0x0010, 0x34)
                    .result(incrementP)
                    .read(0x0011, 0x12)
                    .result(incrementP)
                    .read(0x1234, 0x43)
                    .run<Absolute, undefined>(
                        s => ({ ...s, p: 0x0010 }),
                        (state, bus) => new Absolute(state, bus),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x43)));
        });

        suite('indirect', () => {
            test('no page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x56)
                    .result(incrementP)
                    .read(0x0011, 0x34)
                    .result(incrementP)
                    .read(0x3456, 0x34)
                    .read(0x3457, 0x12)
                    .run<Indirect, undefined>(
                        s => ({ ...s, p: 0x0010 }),
                        (state, bus) => new Indirect(state, bus),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x1234)));

            test('page boundary', () =>
                Runner.build()
                    .read(0x0010, 0xff)
                    .result(incrementP)
                    .read(0x0011, 0x34)
                    .result(incrementP)
                    .read(0x34ff, 0x34)
                    .read(0x3400, 0x12)
                    .run<Indirect, undefined>(
                        s => ({ ...s, p: 0x0010 }),
                        (state, bus) => new Indirect(state, bus),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x1234)));
        });

        suite('absolute indexed', () => {
            test('no derereference, read, no page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x24)
                    .result(incrementP)
                    .read(0x0011, 0x12)
                    .result(incrementP)
                    .run<AbsoluteIndexed, undefined>(
                        s => ({ ...s, p: 0x0010, x: 0x10 }),
                        (state, bus) => AbsoluteIndexed.absoluteX(state, bus, false, false),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x1234)));

            test('no derereference, read, page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x35)
                    .result(incrementP)
                    .read(0x0011, 0x11)
                    .result(incrementP)
                    .read(0x1134, 0x42)
                    .run<AbsoluteIndexed, undefined>(
                        s => ({ ...s, p: 0x0010, y: 0xff }),
                        (state, bus) => AbsoluteIndexed.absoluteY(state, bus, false, false),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x1234)));

            test('derereference, read, no page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x24)
                    .result(incrementP)
                    .read(0x0011, 0x12)
                    .result(incrementP)
                    .read(0x1234, 0x66)
                    .run<AbsoluteIndexed, undefined>(
                        s => ({ ...s, p: 0x0010, x: 0x10 }),
                        (state, bus) => AbsoluteIndexed.absoluteX(state, bus, true, false),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x66)));

            test('derereference, read, page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x35)
                    .result(incrementP)
                    .read(0x0011, 0x11)
                    .result(incrementP)
                    .read(0x1134, 0x42)
                    .read(0x1234, 0x66)
                    .run<AbsoluteIndexed, undefined>(
                        s => ({ ...s, p: 0x0010, y: 0xff }),
                        (state, bus) => AbsoluteIndexed.absoluteY(state, bus, true, false),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x66)));

            test('no derereference, write, no page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x24)
                    .result(incrementP)
                    .read(0x0011, 0x12)
                    .result(incrementP)
                    .read(0x1234, 0x66)
                    .run<AbsoluteIndexed, undefined>(
                        s => ({ ...s, p: 0x0010, x: 0x10 }),
                        (state, bus) => AbsoluteIndexed.absoluteX(state, bus, false, true),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x1234)));

            test('no derereference, write, page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x35)
                    .result(incrementP)
                    .read(0x0011, 0x11)
                    .result(incrementP)
                    .read(0x1134, 0x42)
                    .run<AbsoluteIndexed, undefined>(
                        s => ({ ...s, p: 0x0010, y: 0xff }),
                        (state, bus) => AbsoluteIndexed.absoluteY(state, bus, false, true),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x1234)));

            test('derereference, write, no page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x24)
                    .result(incrementP)
                    .read(0x0011, 0x12)
                    .result(incrementP)
                    .read(0x1234, 0x66)
                    .read(0x1234, 0x66)
                    .run<AbsoluteIndexed, undefined>(
                        s => ({ ...s, p: 0x0010, x: 0x10 }),
                        (state, bus) => AbsoluteIndexed.absoluteX(state, bus, true, true),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x66)));

            test('derereference, write, page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x35)
                    .result(incrementP)
                    .read(0x0011, 0x11)
                    .result(incrementP)
                    .read(0x1134, 0x42)
                    .read(0x1234, 0x66)
                    .run<AbsoluteIndexed, undefined>(
                        s => ({ ...s, p: 0x0010, y: 0xff }),
                        (state, bus) => AbsoluteIndexed.absoluteY(state, bus, true, true),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x66)));
        });

        suite('zeropage indexed', () => {
            test('no dereference, no page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x60)
                    .result(incrementP)
                    .read(0x60, 0x12)
                    .run<ZeroPageIndexed, undefined>(
                        s => ({ ...s, p: 0x0010, x: 0x06 }),
                        (state, bus) => ZeroPageIndexed.zeroPageX(state, bus, false),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x66)));

            test('dereference, no page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x60)
                    .result(incrementP)
                    .read(0x60, 0x66)
                    .read(0x66, 0x42)
                    .run<ZeroPageIndexed, undefined>(
                        s => ({ ...s, p: 0x0010, y: 0x06 }),
                        (state, bus) => ZeroPageIndexed.zeroPageY(state, bus, true),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x42)));

            test('no dereference, page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x67)
                    .result(incrementP)
                    .read(0x67, 0x12)
                    .run<ZeroPageIndexed, undefined>(
                        s => ({ ...s, p: 0x0010, x: 0xff }),
                        (state, bus) => ZeroPageIndexed.zeroPageX(state, bus, false),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x66)));

            test('dereference, page boundary', () =>
                Runner.build()
                    .read(0x0010, 0x67)
                    .result(incrementP)
                    .read(0x67, 0x12)
                    .read(0x66, 0x42)
                    .run<ZeroPageIndexed, undefined>(
                        s => ({ ...s, p: 0x0010, y: 0xff }),
                        (state, bus) => ZeroPageIndexed.zeroPageY(state, bus, true),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x42)));
        });

        suite('indexed indirect', () => {
            test('no dereference, no page boundary', () =>
                Runner.build()
                    .read(0x10, 0x30)
                    .result(incrementP)
                    .read(0x30, 0x42)
                    .read(0x40, 0x34)
                    .read(0x41, 0x12)
                    .run<IndexedIndirectX, undefined>(
                        s => ({ ...s, p: 0x0010, x: 0x10 }),
                        (state, bus) => new IndexedIndirectX(state, bus, false),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x1234)));

            test('dereference, no page boundary', () =>
                Runner.build()
                    .read(0x10, 0x30)
                    .result(incrementP)
                    .read(0x30, 0x42)
                    .read(0x40, 0x34)
                    .read(0x41, 0x12)
                    .read(0x1234, 0x66)
                    .run<IndexedIndirectX, undefined>(
                        s => ({ ...s, p: 0x0010, x: 0x10 }),
                        (state, bus) => new IndexedIndirectX(state, bus, true),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x66)));

            test('no dereference, page boundary', () =>
                Runner.build()
                    .read(0x10, 0x50)
                    .result(incrementP)
                    .read(0x50, 0x42)
                    .read(0x40, 0x34)
                    .read(0x41, 0x12)
                    .run<IndexedIndirectX, undefined>(
                        s => ({ ...s, p: 0x0010, x: 0xf0 }),
                        (state, bus) => new IndexedIndirectX(state, bus, false),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x1234)));

            test('dereference, page boundary', () =>
                Runner.build()
                    .read(0x10, 0x50)
                    .result(incrementP)
                    .read(0x50, 0x42)
                    .read(0x40, 0x34)
                    .read(0x41, 0x12)
                    .read(0x1234, 0x66)
                    .run<IndexedIndirectX, undefined>(
                        s => ({ ...s, p: 0x0010, x: 0xf0 }),
                        (state, bus) => new IndexedIndirectX(state, bus, true),
                        undefined
                    )
                    .assert(s => strictEqual(s.operand, 0x66)));
        });
    });
}
