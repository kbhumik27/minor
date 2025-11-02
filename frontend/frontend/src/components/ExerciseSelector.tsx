import { Dumbbell, Target } from 'lucide-react';
import { api } from '../services/api';
import type { ExerciseType } from '../types';

interface ExerciseSelectorProps {
  currentExercise: ExerciseType;
  onExerciseChange: (exercise: ExerciseType) => void;
}

const exercises: { value: ExerciseType; label: string }[] = [
  { value: 'Ready', label: 'Ready' },
  { value: 'squat', label: 'Squat' },
  { value: 'pushup', label: 'Push-up' },
  { value: 'bicep_curl', label: 'Bicep Curl' },
];

export const ExerciseSelector = ({ currentExercise, onExerciseChange }: ExerciseSelectorProps) => {
  const handleExerciseSelect = async (exercise: ExerciseType) => {
    try {
      await api.setExercise(exercise);
      onExerciseChange(exercise);
    } catch (error) {
      console.error('Failed to set exercise:', error);
    }
  };

  return (
    <div className="glass-card p-6 mb-8">
      <h2 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-3">
        <Dumbbell className="w-8 h-8 text-purple-400" />
        Select Exercise
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {exercises.map((exercise) => (
          <button
            key={exercise.value}
            onClick={() => handleExerciseSelect(exercise.value)}
            className={`px-6 py-4 rounded-xl font-semibold text-white transition-all ${
              currentExercise === exercise.value
                ? 'bg-purple-500 shadow-lg shadow-purple-500/50 scale-105'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <Target className="w-6 h-6 mx-auto mb-2" />
            {exercise.label}
          </button>
        ))}
      </div>
    </div>
  );
};
