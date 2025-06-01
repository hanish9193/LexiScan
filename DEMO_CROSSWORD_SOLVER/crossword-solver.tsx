"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, RotateCcw } from "lucide-react"

interface Position {
  x: number
  y: number
}

interface FoundWord {
  word: string
  positions: Position[]
  direction: string
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

  const [grid] = useState(initialGrid)
  const [searchWord, setSearchWord] = useState("HANISH")
  const [foundWords, setFoundWords] = useState<FoundWord[]>([])
  const [highlightedPositions, setHighlightedPositions] = useState<Position[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // All 8 directions: right, left, down, up, and 4 diagonals
  const directions = [
    { dx: 1, dy: 0, name: "Right" }, // Right
    { dx: -1, dy: 0, name: "Left" }, // Left
    { dx: 0, dy: 1, name: "Down" }, // Down
    { dx: 0, dy: -1, name: "Up" }, // Up
    { dx: 1, dy: 1, name: "Down-Right" }, // Down-Right diagonal
    { dx: 1, dy: -1, name: "Up-Right" }, // Up-Right diagonal
    { dx: -1, dy: 1, name: "Down-Left" }, // Down-Left diagonal
    { dx: -1, dy: -1, name: "Up-Left" }, // Up-Left diagonal
  ]

  const isValidPosition = (x: number, y: number): boolean => {
    return x >= 0 && x < grid[0].length && y >= 0 && y < grid.length
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

      if (!isValidPosition(x, y) || grid[y][x] !== word[i]) {
        return null
      }

      positions.push({ x, y })
    }

    return positions
  }

  const findAllOccurrences = useCallback(
    (word: string): FoundWord[] => {
      const found: FoundWord[] = []
      const upperWord = word.toUpperCase()

      // Search for the first letter
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
          if (grid[y][x] === upperWord[0]) {
            // Try all 8 directions from this position
            for (const direction of directions) {
              const positions = searchWordInDirection(x, y, upperWord, direction)
              if (positions) {
                found.push({
                  word: upperWord,
                  positions,
                  direction: direction.name,
                })
              }
            }
          }
        }
      }

      return found
    },
    [grid],
  )

  const handleSearch = () => {
    if (!searchWord.trim()) return

    const results = findAllOccurrences(searchWord)
    setFoundWords(results)

    // Highlight all found positions
    const allPositions = results.flatMap((result) => result.positions)
    setHighlightedPositions(allPositions)

    // Add to search history
    if (!searchHistory.includes(searchWord.toUpperCase())) {
      setSearchHistory((prev) => [searchWord.toUpperCase(), ...prev].slice(0, 5))
    }
  }

  const handleReset = () => {
    setFoundWords([])
    setHighlightedPositions([])
    setSearchWord("")
  }

  const isHighlighted = (x: number, y: number): boolean => {
    return highlightedPositions.some((pos) => pos.x === x && pos.y === y)
  }

  const getPositionColor = (x: number, y: number): string => {
    if (!isHighlighted(x, y)) return ""

    // Different colors for different found words
    for (let i = 0; i < foundWords.length; i++) {
      if (foundWords[i].positions.some((pos) => pos.x === x && pos.y === y)) {
        const colors = ["bg-red-200", "bg-blue-200", "bg-green-200", "bg-yellow-200", "bg-purple-200"]
        return colors[i % colors.length]
      }
    }
    return "bg-gray-200"
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Crossword Puzzle Solver</CardTitle>
          <p className="text-muted-foreground text-center">
            Enter a word to search in all 8 directions (horizontal, vertical, diagonal)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter word to search (e.g., HANISH)"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} className="px-6">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {searchHistory.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Recent searches:</p>
              <div className="flex gap-2 flex-wrap">
                {searchHistory.map((word, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Crossword Grid</CardTitle>
            <p className="text-sm text-muted-foreground">Click search to highlight found words in different colors</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 gap-1 max-w-md mx-auto">
              {grid.map((row, y) =>
                row.map((letter, x) => (
                  <div
                    key={`${x}-${y}`}
                    className={`
                      w-8 h-8 border border-gray-300 flex items-center justify-center
                      text-sm font-bold transition-colors duration-200
                      ${getPositionColor(x, y)}
                      ${isHighlighted(x, y) ? "border-gray-600 border-2" : ""}
                    `}
                  >
                    {letter}
                  </div>
                )),
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <p className="text-sm text-muted-foreground">Found words and their directions</p>
          </CardHeader>
          <CardContent>
            {foundWords.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No words found. Try searching for a word!</p>
            ) : (
              <div className="space-y-3">
                <p className="font-medium">
                  Found {foundWords.length} occurrence(s) of "{searchWord.toUpperCase()}":
                </p>
                {foundWords.map((result, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.word}</span>
                      <Badge variant="outline">{result.direction}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        Starting position: ({result.positions[0].x}, {result.positions[0].y})
                      </p>
                      <p>Path: {result.positions.map((pos) => `(${pos.x},${pos.y})`).join(" → ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Algorithm Explanation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p>
              <strong>Step 1:</strong> Find all occurrences of the first letter in the grid
            </p>
            <p>
              <strong>Step 2:</strong> For each found position (x, y), search in all 8 directions:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Right: (x+1, y), (x+2, y), ...</li>
              <li>Left: (x-1, y), (x-2, y), ...</li>
              <li>Down: (x, y+1), (x, y+2), ...</li>
              <li>Up: (x, y-1), (x, y-2), ...</li>
              <li>Down-Right: (x+1, y+1), (x+2, y+2), ...</li>
              <li>Up-Right: (x+1, y-1), (x+2, y-2), ...</li>
              <li>Down-Left: (x-1, y+1), (x-2, y+2), ...</li>
              <li>Up-Left: (x-1, y-1), (x-2, y-2), ...</li>
            </ul>
            <p>
              <strong>Step 3:</strong> Check if the complete word matches in that direction
            </p>
            <p>
              <strong>Step 4:</strong> Highlight all found matches with different colors
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
