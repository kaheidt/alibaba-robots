import { getStaticAssetUrl } from './cdnHelper'

// Audio elements that persist across component lifetimes
const battleMusic = new Audio()
const effectsAudio = new Audio()

// Track if music is currently playing
let isMusicPlaying = false

// Audio files to preload
const PERCUSSION_SOUNDS = [
  'Percussion A.mp3',
  'Percussion B.mp3'
]

const BOSS_STRIKE_SOUNDS = [
  'Boss Strike B.mp3',
  'Boss Strike C.mp3',
  'Boss Strike D.mp3',
  'Boss Strike E.mp3',
  'Boss Strike F.mp3',
  'Boss Strike G.mp3'
]

// Store preloaded audio elements
const preloadedAudio: Record<string, HTMLAudioElement> = {}

/**
 * Audio manager for game sounds and music
 */
export const audioManager = {
  /**
   * Preload all audio assets to avoid lag when playing them
   * @returns {Promise<void>} Resolves when assets are preloaded
   */
  preloadAssets(): Promise<void> {
    console.log('Preloading audio assets...')
    
    const allSounds = [...PERCUSSION_SOUNDS, ...BOSS_STRIKE_SOUNDS]
    const preloadPromises = allSounds.map(sound => {
      return new Promise<void>((resolve) => {
        const audio = new Audio()
        const soundUrl = getStaticAssetUrl(sound)
        
        // Store the preloaded audio element
        preloadedAudio[sound] = audio
        
        // Set up event handlers
        audio.addEventListener('canplaythrough', () => {
          console.log(`Preloaded: ${sound}`)
          resolve()
        }, { once: true })
        
        audio.addEventListener('error', () => {
          console.error(`Failed to preload: ${sound}`)
          resolve() // Resolve anyway to not block other sounds
        }, { once: true })
        
        // Start loading
        audio.src = soundUrl
        audio.load()
      })
    })
    
    return Promise.all(preloadPromises).then(() => {
      console.log('All audio assets preloaded')
    })
  },
  
  /**
   * Start playing background percussion music
   * @returns {void}
   */
  startBattleMusic(): void {
    // Don't restart if already playing
    if (isMusicPlaying) return
    
    const randomSound = PERCUSSION_SOUNDS[Math.floor(Math.random() * PERCUSSION_SOUNDS.length)]
    
    console.log('Starting battle music:', randomSound)
    const soundUrl = getStaticAssetUrl(randomSound)
    
    // Use preloaded audio if available
    if (preloadedAudio[randomSound]) {
      // Clone the preloaded audio for playback
      battleMusic.src = preloadedAudio[randomSound].src
    } else {
      battleMusic.src = soundUrl
    }
    
    battleMusic.loop = true
    battleMusic.volume = 0.6
    
    const playPromise = battleMusic.play()
    if (playPromise) {
      playPromise
        .then(() => {
          console.log('Battle music playing successfully')
          isMusicPlaying = true
        })
        .catch(err => {
          console.error('Could not play battle music:', err)
        })
    }
  },
  
  /**
   * Stop background battle music
   * @returns {void}
   */
  stopBattleMusic(): void {
    console.log('Stopping battle music')
    battleMusic.pause()
    battleMusic.currentTime = 0
    isMusicPlaying = false
  },
  
  /**
   * Play a random Boss Strike sound effect
   * @returns {void}
   */
  playBossStrikeSound(): void {
    const randomSound = BOSS_STRIKE_SOUNDS[Math.floor(Math.random() * BOSS_STRIKE_SOUNDS.length)]
    
    console.log('Playing boss strike sound:', randomSound)
    
    // Use preloaded audio if available
    if (preloadedAudio[randomSound]) {
      // Clone the preloaded audio for playback
      effectsAudio.src = preloadedAudio[randomSound].src
    } else {
      const soundUrl = getStaticAssetUrl(randomSound)
      effectsAudio.src = soundUrl
    }
    
    effectsAudio.volume = 0.8
    effectsAudio.play().catch(err => {
      console.error('Could not play boss strike sound:', err)
    })
  }
}