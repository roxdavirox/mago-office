import Phaser from 'phaser'

/**
 * EventBus — bridge de comunicação entre React e Phaser.
 *
 * React emite eventos para a cena Phaser atualizar sprites.
 * Phaser emite eventos para React atualizar UI (posição de SpeechBubble, etc).
 *
 * Uso:
 *   EventBus.emit('agents-updated', agents)
 *   EventBus.on('scene-ready', (scene) => { ... })
 */
export const EventBus = new Phaser.Events.EventEmitter()
