import BusInterface from '../bus/BusInterface';
import Event from '../../tools/event/Event';
import Tia from './tia/Tia';
import Pia from './Pia';
import CartridgeInterface from './cartridge/CartridgeInterface';

class Bus implements BusInterface {

    setTia(tia: Tia): Bus {
        tia.trap.addHandler((payload: Tia.TrapPayload) =>
                this.triggerTrap(Bus.TrapReason.tia, 'TIA: ' + (payload.message || '')));

        this._tia = tia;

        return this;
    }

    setPia(pia: Pia): Bus {
        pia.trap.addHandler((payload: Pia.TrapPayload) =>
                this.triggerTrap(Bus.TrapReason.pia, 'PIA: ' + (payload.message || '')));

        this._pia = pia;

        return this;
    }

    setCartridge(cartridge: CartridgeInterface): Bus {
        cartridge.trap.addHandler((payload: CartridgeInterface.TrapPayload) =>
                this.triggerTrap(Bus.TrapReason.cartridge, 'CARTRIDGE: ' + (payload.message || '')));

        this._cartridge = cartridge;

        return this;
    }

    readWord(address: number): number {
        return this.read(address) | ((this.read((address + 1) & 0xFFFF)) << 8);
    }

    read(address: number): number {
        // Mask out bits 13-15
        this._lastAddressBusValue = address;
        address &= 0x1FFF;

        // Chip select A12 -> cartridge
        if (address & 0x1000) {
            this._lastDataBusValue = this._cartridge.read(address);
            this.event.read.dispatch(Bus.AccessType.cartridge);
        }
        // Chip select A7 -> PIA
        else if (address & 0x80) {
            this._lastDataBusValue = this._pia.read(address);
            this.event.read.dispatch(Bus.AccessType.pia);
        }
        else {
            this._lastDataBusValue = this._tia.read(address);
            this.event.read.dispatch(Bus.AccessType.tia);
        }

        return this._lastDataBusValue;
    }

    write(address: number, value: number): void {
        this._lastDataBusValue = value;
        this._lastAddressBusValue = address;

        // Mask out bits 12-15
        address &= 0x1FFF;

        // Chip select A12 -> cartridge
        if (address & 0x1000) {
            this._cartridge.write(address, value);
            this.event.write.dispatch(Bus.AccessType.cartridge);
        }
        // Chip select A7 -> PIA
        else if (address & 0x80) {
            this._pia.write(address, value);
            this.event.write.dispatch(Bus.AccessType.pia);
        }
        else {
            this._tia.write(address, value);
            this.event.write.dispatch(Bus.AccessType.tia);
        }
    }

    peek(address: number): number {
        return this.read(address);
    }

    // Stub
    poke(address: number, value: number) {}

    getLastDataBusValue(): number {
        return this._lastDataBusValue;
    }

    getLastAddresBusValue(): number {
        return this._lastAddressBusValue;
    }

    private triggerTrap(reason: Bus.TrapReason, message?: string): void {
        if (this.event.trap.hasHandlers) {
            this.event.trap.dispatch(new Bus.TrapPayload(reason, this, message));
        } else {
            throw new Error(message);
        }
    }

    event = {
        trap: new Event<Bus.TrapPayload>(),
        read: new Event<Bus.AccessType>(),
        write: new Event<Bus.AccessType>()
    };


    private _tia: Tia = null;
    private _pia: Pia = null;
    private _cartridge: CartridgeInterface = null;

    private _lastDataBusValue = 0;
    private _lastAddressBusValue = 0;
}

module Bus {

    export const enum TrapReason {tia, pia, cartridge}

    export const enum AccessType {tia, pia, cartridge}

    export class TrapPayload {

        constructor (
            public reason: TrapReason,
            public bus: Bus,
            public message?: string
        ) {}

    }

}

export default Bus;
