// Point d'entrée unique de la couche données.
// Les stores importent UNIQUEMENT `api` et ignorent s'ils parlent au mock
// ou à la vraie API : la bascule se fait ici via le flag USE_MOCK.
//
// À l'intégration (Phase 5) : mettre USE_MOCK=false dans config.js, puis
// supprimer l'import et la branche `mockApi` ci-dessous + le fichier mock.js.
import { USE_MOCK } from '../config'
import { httpApi } from './http'
import { mockApi } from './mock'

export const api = USE_MOCK ? mockApi : httpApi
