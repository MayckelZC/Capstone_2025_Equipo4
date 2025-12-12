import { Injectable } from '@angular/core';
import { AngularFirestore, Query, QueryDocumentSnapshot } from '@angular/fire/compat/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface PaginationConfig {
    pageSize: number;
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    items: T[];
    hasMore: boolean;
    lastDoc: QueryDocumentSnapshot<T> | null;
}

@Injectable({
    providedIn: 'root'
})
export class PaginationService {
    private lastDocuments = new Map<string, QueryDocumentSnapshot<any>>();
    private hasMoreMap = new Map<string, boolean>();

    constructor(private firestore: AngularFirestore) { }

    /**
     * Obtiene una colección paginada de Firestore
     * @param collectionPath Ruta de la colección
     * @param pageSize Número de items por página
     * @param queryFn Función opcional para agregar filtros
     * @param cacheKey Clave única para cachear el último documento
     */
    getPaginatedCollection<T>(
        collectionPath: string,
        pageSize: number = 20,
        queryFn?: (ref: Query) => Query,
        cacheKey?: string
    ): Observable<PaginatedResult<T>> {
        const key = cacheKey || collectionPath;
        const lastDoc = this.lastDocuments.get(key);

        return this.firestore.collection<T>(collectionPath, ref => {
            let query: Query = ref.limit(pageSize + 1); // +1 para detectar si hay más

            // Aplicar función de query personalizada
            if (queryFn) {
                query = queryFn(query);
            }

            // Si hay un último documento, continuar desde ahí
            if (lastDoc) {
                query = query.startAfter(lastDoc);
            }

            return query;
        }).snapshotChanges().pipe(
            map(actions => {
                const items = actions.slice(0, pageSize).map(a => {
                    const data = a.payload.doc.data() as T;
                    const id = a.payload.doc.id;
                    return { id, ...data };
                });

                const hasMore = actions.length > pageSize;
                const lastDocument = actions.length > 0 ?
                    actions[Math.min(pageSize - 1, actions.length - 1)].payload.doc :
                    null;

                return {
                    items,
                    hasMore,
                    lastDoc: lastDocument as QueryDocumentSnapshot<T>
                };
            }),
            tap(result => {
                // Cachear el último documento para la siguiente página
                if (result.lastDoc) {
                    this.lastDocuments.set(key, result.lastDoc);
                }
                this.hasMoreMap.set(key, result.hasMore);
            })
        );
    }

    /**
     * Carga la siguiente página
     */
    loadNextPage<T>(
        collectionPath: string,
        pageSize: number = 20,
        queryFn?: (ref: Query) => Query,
        cacheKey?: string
    ): Observable<PaginatedResult<T>> {
        return this.getPaginatedCollection<T>(collectionPath, pageSize, queryFn, cacheKey);
    }

    /**
     * Resetea la paginación para una colección
     */
    resetPagination(cacheKey: string): void {
        this.lastDocuments.delete(cacheKey);
        this.hasMoreMap.delete(cacheKey);
    }

    /**
     * Verifica si hay más páginas disponibles
     */
    hasMore(cacheKey: string): boolean {
        return this.hasMoreMap.get(cacheKey) ?? true;
    }

    /**
     * Obtiene items con infinite scroll
     * Retorna un BehaviorSubject que se puede suscribir
     */
    getInfiniteScrollCollection<T>(
        collectionPath: string,
        config: PaginationConfig = { pageSize: 20 }
    ): {
        items$: BehaviorSubject<T[]>;
        loadMore: () => void;
        reset: () => void;
        hasMore: () => boolean;
    } {
        const items$ = new BehaviorSubject<T[]>([]);
        const cacheKey = `${collectionPath}-infinite`;
        let isLoading = false;

        const loadMore = () => {
            if (isLoading || !this.hasMore(cacheKey)) {
                return;
            }

            isLoading = true;
            const queryFn = config.orderByField ?
                (ref: Query) => ref.orderBy(config.orderByField!, config.orderDirection || 'desc') :
                undefined;

            this.getPaginatedCollection<T>(
                collectionPath,
                config.pageSize,
                queryFn,
                cacheKey
            ).subscribe(result => {
                const currentItems = items$.value;
                items$.next([...currentItems, ...result.items]);
                isLoading = false;
            });
        };

        const reset = () => {
            this.resetPagination(cacheKey);
            items$.next([]);
            loadMore();
        };

        const hasMore = () => this.hasMore(cacheKey);

        // Cargar primera página
        loadMore();

        return { items$, loadMore, reset, hasMore };
    }
}
