// Point d'entrée unique de la couche données : les stores importent `api`
// sans savoir si c'est le mock ou le vrai backend. Bascule via USE_MOCK.
import { USE_MOCK } from '../config'
import { httpApi } from './http'
import { mockApi } from './mock'

export const api = USE_MOCK ? mockApi : httpApi
