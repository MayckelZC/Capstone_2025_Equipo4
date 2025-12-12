import { ActionReducer } from '@ngrx/store';
import { AppState } from '../app.state';

/**
 * Logger Meta-Reducer para desarrollo
 * 
 * Características:
 * - Timestamps en cada acción
 * - Grupos colapsables en la consola
 * - Muestra estado previo, acción y estado siguiente
 * - Filtra acciones ruidosas (como @ngrx/effects/init)
 * - Detecta qué slices del estado cambiaron
 */

// Acciones a filtrar (muy ruidosas en la consola)
const FILTERED_ACTIONS = [
    '@ngrx/effects/init',
    '@ngrx/store/init',
    '@ngrx/store-devtools',
    '@ngrx/router-store'
];

export function logger(reducer: ActionReducer<AppState>): ActionReducer<AppState> {
    return function (state: AppState | undefined, action: any): AppState {
        const actionType = action.type || 'Unknown Action';

        // Filtrar acciones ruidosas
        if (FILTERED_ACTIONS.some(filtered => actionType.includes(filtered))) {
            return reducer(state, action);
        }

        const timestamp = new Date().toLocaleTimeString('es-CL', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Estilos para la consola
        const styles = {
            timestamp: 'color: #9E9E9E; font-style: italic;',
            label: 'color: #666;',
            action: 'color: #4CAF50; font-weight: bold;',
            prevState: 'color: #9E9E9E;',
            nextState: 'color: #4CAF50;',
            payload: 'color: #03A9F4;',
            changes: 'color: #FF9800; font-weight: bold;'
        };

        console.groupCollapsed(
            `%c[${timestamp}] %cAction: %c${actionType}`,
            styles.timestamp,
            styles.label,
            styles.action
        );

        console.log('%cprev state', styles.prevState, state);

        // Mostrar payload si existe (excluyendo el type)
        const { type, ...payload } = action;
        if (Object.keys(payload).length > 0) {
            console.log('%cpayload', styles.payload, payload);
        }

        const nextState = reducer(state, action);
        console.log('%cnext state', styles.nextState, nextState);

        // Mostrar qué slices del estado cambiaron
        if (state) {
            const changes: string[] = [];
            if (state.pets !== nextState.pets) changes.push('pets');
            if (state.users !== nextState.users) changes.push('users');
            if (state.adoptions !== nextState.adoptions) changes.push('adoptions');

            if (changes.length > 0) {
                console.log('%cchanged slices:', styles.changes, changes.join(', '));
            }
        }

        console.groupEnd();

        return nextState;
    };
}
