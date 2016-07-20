// tslint:disable-next-line
import * as React from 'react';

import {
    ControlLabel,
    FormControl
} from 'react-bootstrap';

function CartridgeSettings(props: CartridgeSettings.Props) {
    return <div className={props.visible ? '' : 'hidden'}>
        <ControlLabel>Name:</ControlLabel>
        <FormControl
            type="text"
            value={props.name}
            onChange={(e: Event) => props.onNameChange((e.target as HTMLInputElement).value)}
            onKeyDown={(e: KeyboardEvent) => e.keyCode === 13 ? props.onKeyEnter() : undefined}
        />
    </div>;
}

module CartridgeSettings {

    export interface Props {
        name?: string;
        visible?: boolean;
        onNameChange?: (value: string) => void;
        onKeyEnter?: () => void;
    }

    export const defaultProps: Props = {
        name : '',
        onNameChange: () => undefined,
        onKeyEnter: () => undefined,
        visible: false
    };

}

export default CartridgeSettings;
