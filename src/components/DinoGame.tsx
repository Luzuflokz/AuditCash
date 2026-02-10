'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FaStar } from 'react-icons/fa'; // Import star icon

// Constants for the game
const GAME_WIDTH = 600;
const GAME_HEIGHT = 150;
const DINO_WIDTH = 20;
const DINO_HEIGHT = 40;
const DINO_JUMP_VELOCITY = -8;
const GRAVITY = 0.5;
const OBSTACLE_WIDTH = 15;
const OBSTACLE_HEIGHT = 30;
const OBSTACLE_SPEED = 3;
const OBSTACLE_INTERVAL = 1500; // ms

interface Obstacle {
  x: number;
  y: number;
  id: number;
}

const DinoGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dinoY, setDinoY] = useState(GAME_HEIGHT - DINO_HEIGHT);
  const dinoVelocityRef = useRef(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const lastObstacleTime = useRef(0);
  const gameSpeed = useRef(OBSTACLE_SPEED);
  const [showGame, setShowGame] = useState(false);

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('dinoHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  const resetGame = useCallback(() => {
    setDinoY(GAME_HEIGHT - DINO_HEIGHT);
    dinoVelocityRef.current = 0;
    setObstacles([]);
    setScore(0);
    gameSpeed.current = OBSTACLE_SPEED;
    setIsPlaying(true);
    lastObstacleTime.current = Date.now();
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) { // Clear canvas when game resets
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
  }, []);

  const gameOver = useCallback(() => {
    setIsPlaying(false);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('dinoHighScore', score.toString());
      toast.success(`¡Nuevo récord! ${score} puntos.`);
    } else {
      toast.error(`Fin del juego. Puntuación: ${score}`);
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
  }, [score, highScore]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, currentDinoY: number, currentObstacles: Obstacle[], currentScore: number, currentHighScore: number) => {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw ground
    ctx.fillStyle = '#6e6e6e';
    ctx.fillRect(0, GAME_HEIGHT - 5, GAME_WIDTH, 5);

    // Draw dino
    ctx.fillStyle = '#32cd32'; // Lime green
    ctx.fillRect(0, currentDinoY, DINO_WIDTH, DINO_HEIGHT);

    // Draw obstacles
    ctx.fillStyle = '#ff4500'; // OrangeRed
    currentObstacles.forEach(obstacle => {
      ctx.fillRect(obstacle.x, obstacle.y, OBSTACLE_WIDTH, OBSTACLE_HEIGHT);
    });

    // Draw score
    ctx.fillStyle = 'black'; // Adjusted for light background
    ctx.font = '16px Arial';
    ctx.fillText(`Puntuación: ${currentScore}`, 10, 20);
    ctx.fillText(`Récord: ${currentHighScore}`, GAME_WIDTH - 150, 20);
  }, []);

  const updateGame = useCallback(() => {
    if (!isPlaying) return;

    // Update dino position
    let newDinoY = dinoY + dinoVelocityRef.current;
    dinoVelocityRef.current += GRAVITY;
    if (newDinoY >= GAME_HEIGHT - DINO_HEIGHT) {
      newDinoY = GAME_HEIGHT - DINO_HEIGHT;
      dinoVelocityRef.current = 0;
    }
    setDinoY(newDinoY);

    // Update obstacles
    let currentObstacles = obstacles.map(obstacle => ({
      ...obstacle,
      x: obstacle.x - gameSpeed.current
    })).filter(obstacle => obstacle.x + OBSTACLE_WIDTH > 0);

    // Generate new obstacles
    const now = Date.now();
    if (now - lastObstacleTime.current > OBSTACLE_INTERVAL + Math.random() * 1000 && !currentObstacles.some(obs => obs.x > GAME_WIDTH - 100)) {
      lastObstacleTime.current = now;
      currentObstacles.push({
        x: GAME_WIDTH,
        y: GAME_HEIGHT - OBSTACLE_HEIGHT,
        id: Math.random()
      });
    }
    setObstacles(currentObstacles);

    // Check for collisions
    const dinoX = 0;
    const dinoRight = dinoX + DINO_WIDTH;
    const dinoBottom = newDinoY + DINO_HEIGHT;

    for (const obstacle of currentObstacles) {
      const obstacleRight = obstacle.x + OBSTACLE_WIDTH;
      const obstacleBottom = obstacle.y + OBSTACLE_HEIGHT;

      if (
        dinoRight > obstacle.x &&
        dinoX < obstacleRight &&
        dinoBottom > obstacle.y &&
        newDinoY < obstacleBottom
      ) {
        gameOver();
        return;
      }
    }

    // Update score
    setScore(prevScore => prevScore + 1);
    // Increase speed over time
    if (score % 500 === 0 && score !== 0) {
      gameSpeed.current += 0.5;
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      draw(ctx, newDinoY, currentObstacles, score + 1, highScore);
    }
    animationFrameId.current = requestAnimationFrame(updateGame);
  }, [isPlaying, dinoY, obstacles, score, highScore, gameOver, draw]);

  useEffect(() => {
    if (isPlaying) {
      animationFrameId.current = requestAnimationFrame(updateGame);
      return () => {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
      };
    }
  }, [isPlaying, updateGame]);

  const jump = useCallback(() => {
    if (isPlaying && dinoY >= GAME_HEIGHT - DINO_HEIGHT) {
      dinoVelocityRef.current = DINO_JUMP_VELOCITY;
    }
  }, [isPlaying, dinoY]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && isPlaying) { // Only jump if playing
      event.preventDefault(); // Prevent scrolling
      jump();
    }
  }, [isPlaying, jump]);

  const handleCanvasClick = useCallback(() => {
    if (isPlaying) { // Only jump if playing
      jump();
    }
  }, [isPlaying, jump]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Initial draw when component mounts or resets if game is not playing
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && !isPlaying) {
      draw(ctx, GAME_HEIGHT - DINO_HEIGHT, [], score, highScore); // Draw initial state
    }
  }, [draw, isPlaying, score, highScore]);


  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-[#1f2937]">Dino Run</h2>
        <button onClick={() => setShowGame(prev => !prev)} className="text-xl text-yellow-500 hover:text-yellow-600 focus:outline-none">
          <FaStar />
        </button>
      </div>

      {showGame && (
        <>
          <p className="mb-4 text-gray-700">
            Presiona ESPACIO o haz clic en el juego para saltar. ¡No toques los obstáculos!
          </p>
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="bg-gray-200 border border-gray-400 mx-auto block rounded-md cursor-pointer"
            onClick={handleCanvasClick}
          ></canvas>
          {!isPlaying && (
            <button
              onClick={resetGame}
              className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors duration-200"
            >
              {score === 0 ? 'Jugar' : 'Volver a Jugar'}
            </button>
          )}
          <p className="mt-2 text-xl font-bold text-gray-800">Puntuación: {score} | Récord: {highScore}</p>
        </>
      )}
    </div>
  );
};

export default DinoGame;
