import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

const ROBOT_PARTS = {
  heads: ['Standard', 'Battle', 'Scout'],
  bodies: ['Light', 'Medium', 'Heavy'],
  arms: ['Laser', 'Plasma', 'Missile'],
  legs: ['Wheels', 'Tracks', 'Legs']
}

const CATEGORY_TO_TYPE = {
  heads: 'head',
  bodies: 'body',
  arms: 'arm',
  legs: 'leg'
} as const

const TYPE_TO_CATEGORY = {
  head: 'heads',
  body: 'bodies',
  arm: 'arms',
  leg: 'legs'
} as const

const DEFAULT_COLORS = {
  heads: { primary: '#666666', secondary: '#444444', accent: '#00ff00' },
  bodies: { primary: '#4d4d4d', secondary: '#3d3d3d', accent: '#5d5d5d' },
  arms: { primary: '#666666', secondary: '#666666', accent: '#ff0000' },
  legs: { primary: '#333333', secondary: '#1a1a1a', accent: '#444444' }
}

export default function RobotCustomizer() {
  const [selectedCategory, setSelectedCategory] = useState('heads')
  const [robotName, setRobotName] = useState('My Robot')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [customColors, setCustomColors] = useState<{[key: string]: {primary: string, secondary: string, accent: string}}>({
    heads: { ...DEFAULT_COLORS.heads },
    bodies: { ...DEFAULT_COLORS.bodies },
    arms: { ...DEFAULT_COLORS.arms },
    legs: { ...DEFAULT_COLORS.legs }
  })
  
  const addRobotPart = useGameStore((state) => state.addRobotPart)
  const saveRobot = useGameStore((state) => state.saveRobot)
  const loadRobot = useGameStore((state) => state.loadRobot)
  const deleteRobot = useGameStore((state) => state.deleteRobot)
  const loadSavedRobots = useGameStore((state) => state.loadSavedRobots)
  const robotParts = useGameStore((state) => state.robotParts)
  const savedRobots = useGameStore((state) => state.savedRobots)
  const calculateRobotStats = useGameStore((state) => state.calculateRobotStats)

  // Get current selected parts
  const selectedParts = robotParts.reduce((acc, part) => {
    const category = TYPE_TO_CATEGORY[part.type as keyof typeof TYPE_TO_CATEGORY];
    acc[category] = part.id.split('-')[1];
    return acc;
  }, {} as { [key: string]: string });

  useEffect(() => {
    loadSavedRobots()
  }, [loadSavedRobots])

  const handlePartSelect = (part: string) => {
    const id = `${selectedCategory}-${part}-${Date.now()}`
    const category = selectedCategory as keyof typeof DEFAULT_COLORS;
    addRobotPart({
      id,
      type: CATEGORY_TO_TYPE[selectedCategory as keyof typeof CATEGORY_TO_TYPE],
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      customColors: {
        primary: customColors[category]?.primary || DEFAULT_COLORS[category].primary,
        secondary: customColors[category]?.secondary || DEFAULT_COLORS[category].secondary,
        accent: customColors[category]?.accent || DEFAULT_COLORS[category].accent
      }
    })
  }

  const handleColorChange = (category: string, colorType: 'primary' | 'secondary' | 'accent', color: string) => {
    const defaultColors = DEFAULT_COLORS[category as keyof typeof DEFAULT_COLORS];
    
    // Update customColors state
    setCustomColors(prev => ({
      ...prev,
      [category]: {
        primary: prev[category]?.primary || defaultColors.primary,
        secondary: prev[category]?.secondary || defaultColors.secondary,
        accent: prev[category]?.accent || defaultColors.accent,
        [colorType]: color
      }
    }))

    // Find and update the existing part of this category
    const partType = CATEGORY_TO_TYPE[category as keyof typeof CATEGORY_TO_TYPE];
    const existingPart = robotParts.find(part => part.type === partType);
    
    if (existingPart) {
      addRobotPart({
        ...existingPart,
        customColors: {
          primary: existingPart.customColors?.primary || defaultColors.primary,
          secondary: existingPart.customColors?.secondary || defaultColors.secondary,
          accent: existingPart.customColors?.accent || defaultColors.accent,
          [colorType]: color
        }
      });
    }
  }

  const handleSaveRobot = async () => {
    if (robotParts.length === 0) {
      setSaveMessage('Add some parts to your robot first!')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }
    
    // Check for existing robot with same name
    const existingRobot = savedRobots.find(robot => robot.name === robotName)
    if (existingRobot) {
      if (!window.confirm(`A robot named "${robotName}" already exists. Do you want to overwrite it?`)) {
        setSaveMessage('Save cancelled')
        setTimeout(() => setSaveMessage(''), 3000)
        return
      }
    }
    
    setIsSaving(true)
    setSaveMessage('Saving robot...')
    
    try {
      await saveRobot(robotName)
      setSaveMessage('Robot saved successfully!')
    } catch (error) {
      console.error('Failed to save robot:', error)
      setSaveMessage('Failed to save robot.')
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const handleLoadRobot = async (robotId: string) => {
    setIsLoading(true)
    try {
      const success = await loadRobot(robotId)
      if (success) {
        setSaveMessage('Robot loaded successfully!')
        const robot = savedRobots.find(r => r.id === robotId)
        if (robot) {
          setRobotName(robot.name)
          // Set the category to match one of the loaded parts
          if (robot.parts.length > 0) {
            const firstPart = robot.parts[0];
            setSelectedCategory(`${firstPart.type}s`); // Add 's' to match category names
          }
        }
      } else {
        setSaveMessage('Failed to load robot.')
      }
    } catch (error) {
      console.error('Error loading robot:', error)
      setSaveMessage('Failed to load robot.')
    } finally {
      setIsLoading(false)
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const handleDeleteRobot = async (robotId: string) => {
    if (!window.confirm('Are you sure you want to delete this robot?')) {
      return
    }

    try {
      const success = await deleteRobot(robotId)
      if (success) {
        setSaveMessage('Robot deleted successfully!')
      } else {
        setSaveMessage('Failed to delete robot.')
      }
    } catch (error) {
      console.error('Error deleting robot:', error)
      setSaveMessage('Failed to delete robot.')
    }
    setTimeout(() => setSaveMessage(''), 3000)
  }

  // Calculate and display current robot stats
  const currentStats = calculateRobotStats(robotParts)

  return (
    <div className="robot-customizer">
      <h2>Robot Builder</h2>
      
      <div className="robot-name">
        <label htmlFor="robot-name">Robot Name:</label>
        <input
          id="robot-name"
          type="text"
          value={robotName}
          onChange={(e) => setRobotName(e.target.value)}
          placeholder="Enter robot name"
        />
      </div>
      
      <div className="categories">
        {Object.keys(ROBOT_PARTS).map((category) => (
          <button
            key={category}
            className={category === selectedCategory ? 'active' : ''}
            onClick={() => setSelectedCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="parts">
        {ROBOT_PARTS[selectedCategory as keyof typeof ROBOT_PARTS].map((part) => (
          <button 
            key={part} 
            onClick={() => handlePartSelect(part)}
            className={selectedParts[selectedCategory] === part ? 'active' : ''}
          >
            {part}
          </button>
        ))}
      </div>

      <div className="color-customizer">
        <h3>Customize Colors</h3>
        <div className="color-pickers">
          <div className="color-picker">
            <label>Primary Color:</label>
            <input
              type="color"
              value={customColors[selectedCategory]?.primary}
              onChange={(e) => handleColorChange(selectedCategory, 'primary', e.target.value)}
            />
          </div>
          {selectedCategory !== 'legs' && selectedCategory !== 'arms' && (
            <>
              <div className="color-picker">
                <label>Secondary Color:</label>
                <input
                  type="color"
                  value={customColors[selectedCategory]?.secondary}
                  onChange={(e) => handleColorChange(selectedCategory, 'secondary', e.target.value)}
                />
              </div>
              <div className="color-picker">
                <label>Accent Color:</label>
                <input
                  type="color"
                  value={customColors[selectedCategory]?.accent}
                  onChange={(e) => handleColorChange(selectedCategory, 'accent', e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {robotParts.length > 0 && (
        <div className="robot-stats-preview">
          <h3>Robot Stats</h3>
          <div className="stat-preview">
            <div>Attack: {currentStats.attack}</div>
            <div>Defense: {currentStats.defense}</div>
            <div>Speed: {currentStats.speed}</div>
            <div>Health: {currentStats.health}</div>
          </div>
        </div>
      )}
      
      <button 
        className="save-button" 
        onClick={handleSaveRobot} 
        disabled={isSaving || savedRobots.length >= 3}
      >
        {isSaving ? 'Saving...' : 'Save Robot'}
      </button>

      {/* Moved Saved Robots Section here */}
      <div className="saved-robots">
        <h3>Saved Robots ({savedRobots.length}/3)</h3>
        {savedRobots.map((robot) => (
          <div key={robot.id} className="saved-robot">
            <span className="robot-info">
              {robot.name}
            </span>
            <div className="robot-actions">
              <button 
                onClick={() => handleLoadRobot(robot.id)}
                disabled={isLoading}
              >
                Load
              </button>
              <button 
                onClick={() => handleDeleteRobot(robot.id)}
                className="delete"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {saveMessage && (
        <div className={`save-message ${saveMessage.includes('Failed') ? 'error' : 'success'}`}>
          {saveMessage}
        </div>
      )}
    </div>
  )
}