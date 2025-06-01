
"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Search, RotateCcw, FileText, History, Grid3X3, Plus, Minus, Sparkles, Zap } from "lucide-react"

interface Position {
  x: number
  y: number
}

interface FoundInstance {
  start: Position
  direction: string
  path: Position[]
}

interface FoundWord {
  word: string
  found: boolean
  instances: FoundInstance[]
}

export default function CrosswordSolver() {
  // Sample crossword grid
  const initialGrid = [
    ["H", "A", "N", "I", "S", "H", "X", "Y"],
    ["E", "L", "L", "O", "W", "O", "R", "L"],
    ["L", "O", "V", "E", "R", "L", "D", "D"],
    ["P", "Y", "T", "H", "O", "N", "A", "M"],
    ["S", "O", "L", "V", "E", "R", "Y", "E"],
    ["C", "O", "D", "E", "R", "S", "T", "A"],
    ["A", "L", "G", "O", "R", "I", "T", "H"],
    ["M", "A", "T", "H", "S", "H", "A", "M"],
  ]

  const [grid, setGrid] = useState(initialGrid)
  const [customGridDimensions, setCustomGridDimensions] = useState({ rows: 8, cols: 8 })
  const [customGrid, setCustomGrid] = useState<string[][]>(() => 
    Array(8).fill(null).map(() => Array(8).fill(""))
  )
  const [isUsingCustomGrid, setIsUsingCustomGrid] = useState(false)
  const [searchWord, setSearchWord] = useState("")
  const [batchWords, setBatchWords] = useState("HANISH\nLOVE\nPYTHON\nCODE\nSOLVER")
  const [foundWords, setFoundWords] = useState<FoundWord[]>([])
  const [highlightedPositions, setHighlightedPositions] = useState<Position[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchProgress, setSearchProgress] = useState(0)

  // All 8 directions
  const directions = [
    { dx: 1, dy: 0, name: "RIGHT" },
    { dx: -1, dy: 0, name: "LEFT" },
    { dx: 0, dy: 1, name: "DOWN" },
    { dx: 0, dy: -1, name: "UP" },
    { dx: 1, dy: 1, name: "DOWN-RIGHT" },
    { dx: 1, dy: -1, name: "UP-RIGHT" },
    { dx: -1, dy: 1, name: "DOWN-LEFT" },
    { dx: -1, dy: -1, name: "UP-LEFT" },
  ]

  const currentGrid = isUsingCustomGrid ? customGrid : grid

  const isValidPosition = (x: number, y: number): boolean => {
    return x >= 0 && x < currentGrid[0].length && y >= 0 && y < currentGrid.length
  }

  const searchWordInDirection = (
    startX: number,
    startY: number,
    word: string,
    direction: { dx: number; dy: number; name: string },
  ): Position[] | null => {
    const positions: Position[] = []

    for (let i = 0; i < word.length; i++) {
      const x = startX + i * direction.dx
      const y = startY + i * direction.dy

      if (!isValidPosition(x, y) || currentGrid[y][x].toLowerCase() !== word[i].toLowerCase()) {
        return null
      }

      positions.push({ x, y })
    }

    return positions
  }

  const findAllOccurrences = useCallback(
    (word: string): FoundWord => {
      const instances: FoundInstance[] = []
      const upperWord = word.toUpperCase()

      for (let y = 0; y < currentGrid.length; y++) {
        for (let x = 0; x < currentGrid[0].length; x++) {
          if (currentGrid[y][x].toLowerCase() === upperWord[0].toLowerCase()) {
            for (const direction of directions) {
              const positions = searchWordInDirection(x, y, upperWord, direction)
              if (positions) {
                instances.push({
                  start: { x, y },
                  direction: direction.name,
                  path: positions,
                })
              }
            }
          }
        }
      }

      return {
        word: upperWord,
        found: instances.length > 0,
        instances,
      }
    },
    [currentGrid],
  )

  const handleSingleSearch = async () => {
    if (!searchWord.trim()) return

    setIsSearching(true)
    setSearchProgress(0)

    const progressInterval = setInterval(() => {
      setSearchProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 50)

    const result = findAllOccurrences(searchWord)
    setFoundWords([result])

    const allPositions = result.instances.flatMap((instance) => instance.path)
    setHighlightedPositions(allPositions)

    if (!searchHistory.includes(searchWord.toUpperCase())) {
      setSearchHistory((prev) => [searchWord.toUpperCase(), ...prev].slice(0, 5))
    }

    setSearchProgress(100)
    setTimeout(() => {
      setIsSearching(false)
      setSearchProgress(0)
    }, 500)
  }

  const handleBatchSearch = async () => {
    const words = batchWords.split('\n').filter(word => word.trim())
    if (words.length === 0) return

    setIsSearching(true)
    setSearchProgress(0)

    const results: FoundWord[] = []
    let allPositions: Position[] = []

    for (let i = 0; i < words.length; i++) {
      const word = words[i].trim()
      if (word) {
        const result = findAllOccurrences(word)
        results.push(result)
        allPositions = [...allPositions, ...result.instances.flatMap((instance) => instance.path)]
        
        if (result.found && !searchHistory.includes(word.toUpperCase())) {
          setSearchHistory((prev) => [word.toUpperCase(), ...prev].slice(0, 10))
        }
      }
      
      setSearchProgress((i + 1) / words.length * 100)
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setFoundWords(results)
    setHighlightedPositions(allPositions)

    setTimeout(() => {
      setIsSearching(false)
      setSearchProgress(0)
    }, 500)
  }

  const handleReset = () => {
    setFoundWords([])
    setHighlightedPositions([])
    setSearchWord("")
    setBatchWords("HANISH\nLOVE\nPYTHON\nCODE\nSOLVER")
  }

  const updateCustomGridDimensions = (rows: number, cols: number) => {
    const newGrid = Array(rows).fill(null).map((_, rowIndex) => 
      Array(cols).fill(null).map((_, colIndex) => 
        rowIndex < customGrid.length && colIndex < customGrid[0].length 
          ? customGrid[rowIndex][colIndex] 
          : ""
      )
    )
    setCustomGrid(newGrid)
    setCustomGridDimensions({ rows, cols })
  }

  const updateCustomGridCell = (row: number, col: number, value: string) => {
    const newGrid = [...customGrid]
    newGrid[row][col] = value.toUpperCase().slice(0, 1)
    setCustomGrid(newGrid)
  }

  const fillCustomGridRandomly = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const newGrid = customGrid.map(row => 
      row.map(() => letters[Math.floor(Math.random() * letters.length)])
    )
    setCustomGrid(newGrid)
  }

  const clearCustomGrid = () => {
    const newGrid = customGrid.map(row => row.map(() => ""))
    setCustomGrid(newGrid)
  }

  const isHighlighted = (x: number, y: number): boolean => {
    return highlightedPositions.some((pos) => pos.x === x && pos.y === y)
  }

  const getPositionColor = (x: number, y: number): string => {
    if (!isHighlighted(x, y)) return "bg-zinc-900/90 border-zinc-700/50 backdrop-blur-sm"

    for (let i = 0; i < foundWords.length; i++) {
      const word = foundWords[i]
      if (word.instances.some(instance => 
        instance.path.some((pos) => pos.x === x && pos.y === y)
      )) {
        const colors = [
          "bg-slate-800/90 border-slate-600/50 backdrop-blur-sm", 
          "bg-gray-800/90 border-gray-600/50 backdrop-blur-sm", 
          "bg-zinc-800/90 border-zinc-600/50 backdrop-blur-sm", 
          "bg-neutral-800/90 border-neutral-600/50 backdrop-blur-sm",
          "bg-stone-800/90 border-stone-600/50 backdrop-blur-sm"
        ]
        return colors[i % colors.length]
      }
    }
    return "bg-slate-800/90 border-slate-600/50 backdrop-blur-sm"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black text-white">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Card className="bg-black/50 border-zinc-800/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="border-b border-zinc-800/50">
            <CardTitle className="text-4xl font-bold text-center text-white flex items-center justify-center gap-4">
              <Grid3X3 className="w-10 h-10" />
              <span className="bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                Crossword Puzzle Solver
              </span>
              <Zap className="w-8 h-8 text-blue-400" />
            </CardTitle>
            <p className="text-gray-300 text-center text-lg">
              Advanced word finder with <span className="text-blue-400">AI-powered</span> pattern matching across all 8 directions
            </p>
          </CardHeader>
          <CardContent className="pt-8">
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-xl">
                <TabsTrigger 
                  value="single" 
                  className="data-[state=active]:bg-black/70 data-[state=active]:text-white backdrop-blur-sm transition-all duration-300 hover:bg-black/50"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Single Word
                </TabsTrigger>
                <TabsTrigger 
                  value="batch" 
                  className="data-[state=active]:bg-black/70 data-[state=active]:text-white backdrop-blur-sm transition-all duration-300 hover:bg-black/50"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Batch Search
                </TabsTrigger>
                <TabsTrigger 
                  value="custom" 
                  className="data-[state=active]:bg-black/70 data-[state=active]:text-white backdrop-blur-sm transition-all duration-300 hover:bg-black/50"
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Custom Grid
                </TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-6">
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter word to search (e.g., HANISH)"
                    value={searchWord}
                    onChange={(e) => setSearchWord(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSingleSearch()}
                    className="bg-black/30 border-zinc-800/50 text-white placeholder-gray-400 backdrop-blur-xl transition-all duration-300 hover:bg-black/40 hover:border-zinc-700/60 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <Button 
                    onClick={handleSingleSearch} 
                    disabled={isSearching}
                    className="px-8 bg-gradient-to-r from-zinc-900/70 to-black/70 hover:from-zinc-800/70 hover:to-zinc-900/70 border border-zinc-700/40 backdrop-blur-xl transition-all duration-300"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                  <Button 
                    onClick={handleReset} 
                    variant="outline"
                    className="bg-black/30 border-zinc-800/40 hover:bg-zinc-900/50 text-white backdrop-blur-xl transition-all duration-300"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="batch" className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    Words to search (one per line):
                  </label>
                  <Textarea
                    placeholder="Enter words to search, one per line..."
                    value={batchWords}
                    onChange={(e) => setBatchWords(e.target.value)}
                    className="min-h-32 bg-black/30 border-zinc-800/40 text-white placeholder-gray-400 backdrop-blur-xl transition-all duration-300 hover:bg-black/40 hover:border-zinc-700/60 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleBatchSearch} 
                    disabled={isSearching}
                    className="px-8 bg-gradient-to-r from-blue-900/70 to-indigo-900/70 hover:from-blue-800/70 hover:to-indigo-800/70 border border-blue-700/40 backdrop-blur-xl transition-all duration-300"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search All
                  </Button>
                  <Button 
                    onClick={handleReset} 
                    variant="outline"
                    className="bg-black/30 border-zinc-800/40 hover:bg-zinc-900/50 text-white backdrop-blur-xl transition-all duration-300"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-6 justify-center">
                    <div className="flex items-center gap-3 bg-black/30 backdrop-blur-xl rounded-lg p-3 border border-zinc-800/40">
                      <label className="text-sm font-medium text-gray-300">Rows:</label>
                      <Button 
                        onClick={() => updateCustomGridDimensions(Math.max(3, customGridDimensions.rows - 1), customGridDimensions.cols)}
                        variant="outline" 
                        size="sm"
                        className="h-8 w-8 p-0 bg-black/40 border-zinc-800/40 text-white backdrop-blur-sm hover:bg-red-900/30 hover:border-red-700/40 transition-all duration-300"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-white font-bold w-8 text-center text-lg">{customGridDimensions.rows}</span>
                      <Button 
                        onClick={() => updateCustomGridDimensions(Math.min(15, customGridDimensions.rows + 1), customGridDimensions.cols)}
                        variant="outline" 
                        size="sm"
                        className="h-8 w-8 p-0 bg-black/40 border-zinc-800/40 text-white backdrop-blur-sm hover:bg-green-900/30 hover:border-green-700/40 transition-all duration-300"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 bg-black/30 backdrop-blur-xl rounded-lg p-3 border border-zinc-800/40">
                      <label className="text-sm font-medium text-gray-300">Cols:</label>
                      <Button 
                        onClick={() => updateCustomGridDimensions(customGridDimensions.rows, Math.max(3, customGridDimensions.cols - 1))}
                        variant="outline" 
                        size="sm"
                        className="h-8 w-8 p-0 bg-black/40 border-zinc-800/40 text-white backdrop-blur-sm hover:bg-red-900/30 hover:border-red-700/40 transition-all duration-300"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-white font-bold w-8 text-center text-lg">{customGridDimensions.cols}</span>
                      <Button 
                        onClick={() => updateCustomGridDimensions(customGridDimensions.rows, Math.min(15, customGridDimensions.cols + 1))}
                        variant="outline" 
                        size="sm"
                        className="h-8 w-8 p-0 bg-black/40 border-zinc-800/40 text-white backdrop-blur-sm hover:bg-green-900/30 hover:border-green-700/40 transition-all duration-300"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-3 flex-wrap justify-center">
                    <Button 
                      onClick={() => setIsUsingCustomGrid(true)}
                      variant={isUsingCustomGrid ? "default" : "outline"}
                      className="bg-gradient-to-r from-slate-900/70 to-gray-900/70 hover:from-slate-800/70 hover:to-gray-800/70 border border-slate-700/40 backdrop-blur-xl transition-all duration-300"
                    >
                      <Grid3X3 className="w-4 h-4 mr-2" />
                      Use Custom Grid
                    </Button>
                    <Button 
                      onClick={() => setIsUsingCustomGrid(false)}
                      variant={!isUsingCustomGrid ? "default" : "outline"}
                      className="bg-gradient-to-r from-emerald-900/70 to-teal-900/70 hover:from-emerald-800/70 hover:to-teal-800/70 border border-emerald-700/40 backdrop-blur-xl transition-all duration-300"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Use Default Grid
                    </Button>
                    <Button 
                      onClick={fillCustomGridRandomly}
                      variant="outline"
                      className="bg-black/30 border-zinc-800/40 hover:bg-yellow-900/30 hover:border-yellow-700/40 text-white backdrop-blur-xl transition-all duration-300"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Fill Random
                    </Button>
                    <Button 
                      onClick={clearCustomGrid}
                      variant="outline"
                      className="bg-black/30 border-zinc-800/40 hover:bg-red-900/30 hover:border-red-700/40 text-white backdrop-blur-xl transition-all duration-300"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {isSearching && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Searching with AI precision...
                  </span>
                  <span className="text-blue-400 font-bold">{Math.round(searchProgress)}%</span>
                </div>
                <Progress value={searchProgress} className="bg-zinc-900/40 backdrop-blur-sm h-3 rounded-full" />
              </div>
            )}

            {searchHistory.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-300">Recent searches:</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {searchHistory.map((word, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-zinc-700/50 bg-zinc-800/50 text-gray-200 border-zinc-700/40 backdrop-blur-xl transition-all duration-300"
                      onClick={() => setSearchWord(word)}
                    >
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="bg-black/50 border-zinc-800/50 backdrop-blur-xl shadow-2xl">
            <CardHeader className="border-b border-zinc-800/50">
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Grid3X3 className="w-5 h-5" />
                {isUsingCustomGrid ? "Custom Crossword Grid" : "Crossword Grid"}
              </CardTitle>
              <p className="text-sm text-gray-400">
                {isUsingCustomGrid 
                  ? "Click on cells to edit letters. Found words are highlighted with glassmorphic effects" 
                  : "Found words are highlighted with beautiful glassmorphic effects"
                }
              </p>
            </CardHeader>
            <CardContent className="pt-8">
              <div 
                className="grid gap-2 max-w-md mx-auto"
                style={{ gridTemplateColumns: `repeat(${currentGrid[0]?.length || 8}, minmax(0, 1fr))` }}
              >
                {currentGrid.map((row, y) =>
                  row.map((letter, x) => (
                    isUsingCustomGrid ? (
                      <Input
                        key={`${x}-${y}`}
                        value={letter}
                        onChange={(e) => updateCustomGridCell(y, x, e.target.value)}
                        className={`
                          w-12 h-12 text-center text-sm font-bold transition-all duration-500 p-0
                          ${getPositionColor(x, y)}
                          ${isHighlighted(x, y) ? "border-2 text-white shadow-lg" : "border text-gray-300"}
                          hover:border-blue-500/50
                        `}
                        maxLength={1}
                      />
                    ) : (
                      <div
                        key={`${x}-${y}`}
                        className={`
                          w-12 h-12 flex items-center justify-center
                          text-sm font-bold transition-all duration-500
                          ${getPositionColor(x, y)}
                          ${isHighlighted(x, y) ? "border-2 text-white shadow-lg" : "border text-gray-300"}
                          hover:border-blue-500/50 cursor-pointer
                        `}
                      >
                        {letter}
                      </div>
                    )
                  )),
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-zinc-800/50 backdrop-blur-xl shadow-2xl">
            <CardHeader className="border-b border-zinc-800/50">
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Search className="w-5 h-5" />
                AI Search Results
              </CardTitle>
              <p className="text-sm text-gray-400">
                {foundWords.length > 0 
                  ? `AI found ${foundWords.filter(w => w.found).length} out of ${foundWords.length} words with precision`
                  : "Advanced AI results will appear here after searching"
                }
              </p>
            </CardHeader>
            <CardContent className="pt-8">
              {foundWords.length === 0 ? (
                <div className="text-center py-16">
                  <Search className="w-16 h-16 text-gray-600 mx-auto mb-6" />
                  <p className="text-gray-400 text-lg mb-2">AI-Powered Search Ready</p>
                  <p className="text-sm text-gray-600">Enter words and let our advanced algorithm find patterns</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {foundWords.map((result, index) => (
                    <div 
                      key={index} 
                      className="border border-zinc-800/40 rounded-xl p-5 space-y-4 bg-gradient-to-br from-zinc-950/60 to-black/60 backdrop-blur-xl hover:from-zinc-900/60 hover:to-zinc-950/60 transition-all duration-500"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xl text-white flex items-center gap-2">
                          <Zap className="w-5 h-5 text-blue-400" />
                          {result.word}
                        </span>
                        <Badge 
                          variant={result.found ? "default" : "destructive"}
                          className={result.found 
                            ? "bg-gradient-to-r from-emerald-700/60 to-green-700/60 text-white backdrop-blur-sm border-emerald-500/30" 
                            : "bg-gradient-to-r from-red-900/60 to-red-800/60 text-red-200 backdrop-blur-sm border-red-500/30"
                          }
                        >
                          {result.found ? `✨ ${result.instances.length} found` : "❌ Not found"}
                        </Badge>
                      </div>
                      
                      {result.found && result.instances.map((instance, instIndex) => (
                        <div 
                          key={instIndex} 
                          className="ml-6 p-4 border-l-2 border-blue-500/50 space-y-3 bg-black/20 rounded-r-lg backdrop-blur-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-gradient-to-r from-slate-900/40 to-gray-900/40 border-slate-700/40 text-slate-200 backdrop-blur-sm"
                            >
                              📍 {instance.direction}
                            </Badge>
                            <span className="text-sm text-gray-300">
                              🎯 Start: ({instance.start.x}, {instance.start.y})
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 bg-black/20 p-2 rounded border border-zinc-800/30">
                            🔗 Path: {instance.path.map((pos, i) => (
                              <span key={i} className="text-blue-400 font-mono">
                                ({pos.x},{pos.y}){i < instance.path.length - 1 ? " → " : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-black/50 border-zinc-800/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="border-b border-zinc-800/50">
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-400" />
              Advanced AI Algorithm Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="grid md:grid-cols-2 gap-8 text-sm">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-200 text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  8-Directional Search Vectors
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { dir: "→ Right", coord: "(x+1, y)", color: "text-red-400" },
                    { dir: "← Left", coord: "(x-1, y)", color: "text-blue-400" },
                    { dir: "↓ Down", coord: "(x, y+1)", color: "text-green-400" },
                    { dir: "↑ Up", coord: "(x, y-1)", color: "text-yellow-400" },
                    { dir: "↘ Down-Right", coord: "(x+1, y+1)", color: "text-purple-400" },
                    { dir: "↗ Up-Right", coord: "(x+1, y-1)", color: "text-pink-400" },
                    { dir: "↙ Down-Left", coord: "(x-1, y+1)", color: "text-orange-400" },
                    { dir: "↖ Up-Left", coord: "(x-1, y-1)", color: "text-cyan-400" },
                  ].map((item, i) => (
                    <div key={i} className="bg-black/30 p-3 rounded-lg border border-zinc-800/40 backdrop-blur-sm hover:bg-black/40 transition-all duration-300">
                      <div className={`font-medium ${item.color}`}>{item.dir}</div>
                      <div className="text-gray-500 text-xs font-mono">{item.coord}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-200 text-lg flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-emerald-400" />
                  Enhanced Features
                </h4>
                <div className="space-y-2">
                  {[
                    "🎯 Case-insensitive pattern matching",
                    "🛡️ Advanced boundary validation",
                    "🔍 Multiple instance detection",
                    "✨ Real-time glassmorphic highlighting",
                    "⚡ Parallel batch processing",
                    "🧠 AI-powered search history",
                    "🎨 Custom grid creation engine",
                    "💎 Premium glassmorphic design",
                    "🚀 Optimized O(n*m*8*k) algorithm",
                    "🌟 Professional user interface"
                  ].map((feature, i) => (
                    <div 
                      key={i} 
                      className="text-gray-400 bg-black/20 p-2 rounded border border-zinc-800/30 backdrop-blur-sm hover:bg-black/30 hover:text-gray-300 transition-all duration-300"
                    >
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
