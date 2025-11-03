"""
Enhanced Form Analyzer with 3D Mesh Visualization and Demo Mode
"""

import math
import random
import numpy as np
import time
from datetime import datetime
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple

@dataclass
class Point3D:
    x: float
    y: float
    z: float

@dataclass
class MeshJoint:
    position: Point3D
    name: str
    children: List[str] = None

    def __post_init__(self):
        if self.children is None:
            self.children = []

class HumanMesh:
    """3D human mesh for exercise visualization with enhanced joint tracking"""
    
    def __init__(self):
        # Initialize joint hierarchy with more detailed skeleton
        self.joints: Dict[str, MeshJoint] = {
            # Core body
            'hip': MeshJoint(Point3D(0, 0, 0), 'hip', ['spine', 'left_hip', 'right_hip']),
            'spine': MeshJoint(Point3D(0, 0.3, 0), 'spine', ['chest']),
            'chest': MeshJoint(Point3D(0, 0.5, 0), 'chest', ['neck', 'left_shoulder', 'right_shoulder']),
            'neck': MeshJoint(Point3D(0, 0.7, 0), 'neck', ['head']),
            'head': MeshJoint(Point3D(0, 0.85, 0), 'head'),
            
            # Left arm chain
            'left_shoulder': MeshJoint(Point3D(-0.2, 0.6, 0), 'left_shoulder', ['left_upper_arm']),
            'left_upper_arm': MeshJoint(Point3D(-0.3, 0.5, 0), 'left_upper_arm', ['left_elbow']),
            'left_elbow': MeshJoint(Point3D(-0.4, 0.3, 0), 'left_elbow', ['left_forearm']),
            'left_forearm': MeshJoint(Point3D(-0.5, 0.25, 0), 'left_forearm', ['left_wrist']),
            'left_wrist': MeshJoint(Point3D(-0.6, 0.2, 0), 'left_wrist'),
            
            # Right arm chain
            'right_shoulder': MeshJoint(Point3D(0.2, 0.6, 0), 'right_shoulder', ['right_upper_arm']),
            'right_upper_arm': MeshJoint(Point3D(0.3, 0.5, 0), 'right_upper_arm', ['right_elbow']),
            'right_elbow': MeshJoint(Point3D(0.4, 0.3, 0), 'right_elbow', ['right_forearm']),
            'right_forearm': MeshJoint(Point3D(0.5, 0.25, 0), 'right_forearm', ['right_wrist']),
            'right_wrist': MeshJoint(Point3D(0.6, 0.2, 0), 'right_wrist'),
            
            # Legs for squat visualization
            'left_hip': MeshJoint(Point3D(-0.1, 0, 0), 'left_hip', ['left_knee']),
            'right_hip': MeshJoint(Point3D(0.1, 0, 0), 'right_hip', ['right_knee']),
            'left_knee': MeshJoint(Point3D(-0.15, -0.25, 0), 'left_knee', ['left_ankle']),
            'right_knee': MeshJoint(Point3D(0.15, -0.25, 0), 'right_knee', ['right_ankle']),
            'left_ankle': MeshJoint(Point3D(-0.15, -0.5, 0), 'left_ankle'),
            'right_ankle': MeshJoint(Point3D(0.15, -0.5, 0), 'right_ankle'),
        }
        
        # Store initial positions for reset
        self.initial_positions = {name: MeshJoint(
            Point3D(j.position.x, j.position.y, j.position.z),
            j.name, j.children
        ) for name, j in self.joints.items()}
    
    def update_joint_positions(self, pitch: float, roll: float, exercise: str):
        """Update joint positions based on sensor data and exercise type"""
        # Convert angles to radians
        pitch_rad = math.radians(pitch)
        roll_rad = math.radians(roll)
        
        if exercise == 'bicep_curl':
            self._update_bicep_curl(pitch_rad, roll_rad)
        elif exercise == 'squat':
            self._update_squat(pitch_rad, roll_rad)
        elif exercise == 'pushup':
            self._update_pushup(pitch_rad, roll_rad)
        else:
            self.reset_positions()  # Reset to initial pose for 'ready' state
    
    def _update_bicep_curl(self, pitch_rad: float, roll_rad: float):
        """Update mesh for bicep curl with natural arm movement"""
        # Right arm curl chain
        elbow_height = 0.3 + 0.2 * math.sin(pitch_rad)
        wrist_height = 0.2 + 0.4 * math.sin(pitch_rad)
        
        # Update right arm chain
        self.joints['right_upper_arm'].position = Point3D(
            0.3 * math.cos(roll_rad),
            0.5,
            0.1 * math.sin(roll_rad)
        )
        self.joints['right_elbow'].position = Point3D(
            0.4 * math.cos(roll_rad),
            elbow_height,
            0.15 * math.sin(roll_rad)
        )
        self.joints['right_forearm'].position = Point3D(
            0.5 * math.cos(pitch_rad) * math.cos(roll_rad),
            (elbow_height + wrist_height) / 2,
            0.2 * math.sin(roll_rad)
        )
        self.joints['right_wrist'].position = Point3D(
            0.6 * math.cos(pitch_rad) * math.cos(roll_rad),
            wrist_height,
            0.25 * math.sin(roll_rad)
        )
        
        # Subtle upper body compensation
        self.joints['spine'].position = Point3D(
            0.02 * math.sin(roll_rad),
            0.3,
            0.02 * math.cos(roll_rad)
        )
    
    def _update_squat(self, pitch_rad: float, roll_rad: float):
        """Update mesh for squat movement with full body adjustment"""
        # Calculate vertical displacement for squat depth
        squat_depth = 0.3 * math.sin(-pitch_rad)  # More pronounced movement
        
        # Adjust hip and leg positions
        self.joints['hip'].position = Point3D(
            0.05 * math.sin(roll_rad),
            max(0.1, squat_depth),  # Prevent going below ground
            0.05 * math.cos(roll_rad)
        )
        
        # Update leg chain positions
        knee_bend = 0.25 * (1 - math.cos(pitch_rad))
        for side in ['left', 'right']:
            x_offset = -0.15 if side == 'left' else 0.15
            
            # Adjust knee position
            self.joints[f'{side}_knee'].position = Point3D(
                x_offset + 0.05 * math.sin(roll_rad),
                -0.25 - knee_bend,
                0.1 * math.cos(pitch_rad)
            )
            
            # Adjust ankle position
            self.joints[f'{side}_ankle'].position = Point3D(
                x_offset + 0.02 * math.sin(roll_rad),
                -0.5,
                0.05 * math.cos(pitch_rad)
            )
        
        # Adjust upper body lean
        self.joints['spine'].position = Point3D(
            0.1 * math.sin(roll_rad),
            0.3 + squat_depth,
            -0.1 * math.sin(pitch_rad)
        )
    
    def _update_pushup(self, pitch_rad: float, roll_rad: float):
        """Update mesh for pushup movement"""
        # Calculate body height adjustment
        body_height = 0.3 * (1 + math.cos(pitch_rad))
        
        # Adjust core body position
        self.joints['hip'].position = Point3D(
            0.05 * math.sin(roll_rad),
            body_height,
            0
        )
        
        # Update arm positions
        for side in ['left', 'right']:
            x_offset = -0.2 if side == 'left' else 0.2
            
            # Shoulder position
            self.joints[f'{side}_shoulder'].position = Point3D(
                x_offset + 0.05 * math.sin(roll_rad),
                body_height + 0.3,
                0.1 * math.cos(pitch_rad)
            )
            
            # Elbow position
            self.joints[f'{side}_elbow'].position = Point3D(
                x_offset + 0.1 * math.sin(roll_rad),
                body_height + 0.15,
                0.15 * math.cos(pitch_rad)
            )
            
            # Wrist/hand position (fixed on ground)
            self.joints[f'{side}_wrist'].position = Point3D(
                x_offset,
                0.1,  # Slightly above ground
                0.2
            )
    
    def reset_positions(self):
        """Reset all joints to their initial positions"""
        for name, joint in self.initial_positions.items():
            self.joints[name].position = Point3D(
                joint.position.x,
                joint.position.y,
                joint.position.z
            )
    
    def get_mesh_data(self) -> dict:
        """Get mesh data for frontend visualization"""
        return {
            'joints': {
                name: {
                    'position': {'x': j.position.x, 'y': j.position.y, 'z': j.position.z},
                    'children': j.children,
                    'name': j.name  # Include joint name for frontend labeling
                }
                for name, j in self.joints.items()
            }
        }

class DemoMode:
    """Advanced sensor data simulation for testing"""
    
    def __init__(self):
        self.running = False
        self.exercise = 'Ready'
        self.current_angle = 0
        self.direction = 1  # 1 for up, -1 for down
        self.speed = 1  # degrees per update (slowed down from 2)
        self.rep_count = 0
        self.heart_rate = 70
        self.exercise_params = {
            'bicep_curl': {
                'min_angle': 0,
                'max_angle': 90,
                'speed': 0.8,  # Slowed down from 2
                'roll_range': (-5, 5)
            },
            'squat': {
                'min_angle': 0,
                'max_angle': -60,
                'speed': 0.6,  # Slowed down from 1.5
                'roll_range': (-10, 10)
            },
            'pushup': {
                'min_angle': 0,
                'max_angle': 40,
                'speed': 0.7,  # Slowed down from 1.8
                'roll_range': (-8, 8)
            }
        }
        self.transition_state = None
        self.transition_timer = 0
        self.fatigue_factor = 0  # Increases with reps, affects form
        
    def start(self, exercise: str):
        """Start demo mode with specified exercise"""
        self.running = True
        self.exercise = exercise
        self.current_angle = 0
        self.direction = 1
        self.rep_count = 0
        self.heart_rate = 70
        self.fatigue_factor = 0
        self.transition_state = 'starting'
        self.transition_timer = 10  # Frames for smooth transition
        
    def stop(self):
        """Stop demo mode"""
        self.running = False
        self.exercise = 'Ready'
        self.transition_state = 'stopping'
        self.transition_timer = 10
        
    def _update_heart_rate(self):
        """Simulate heart rate changes based on exercise intensity"""
        base_rate = 70
        exercise_intensity = abs(self.current_angle) / 90.0
        fatigue_impact = self.fatigue_factor * 0.1
        
        # Store last beat time for realistic beat detection
        if not hasattr(self, 'last_beat_time'):
            self.last_beat_time = time.time()
            self.beat_interval = 60.0 / self.heart_rate  # seconds between beats
        
        target_hr = base_rate + (50 * exercise_intensity) + (10 * fatigue_impact)
        current_hr = self.heart_rate
        
        # Smooth heart rate changes
        if current_hr < target_hr:
            self.heart_rate = min(target_hr, current_hr + 2)
        else:
            self.heart_rate = max(target_hr, current_hr - 1)
            
    def _apply_natural_variation(self, value, range_percent=0.05):
        """Add natural variation to values"""
        variation = value * range_percent * random.uniform(-1, 1)
        return value + variation
    
    def _get_acceleration_data(self):
        """Generate realistic acceleration data based on movement"""
        params = self.exercise_params.get(self.exercise, {})
        
        # Base acceleration affected by movement and fatigue
        ax = random.uniform(-0.1, 0.1) * (1 + self.fatigue_factor * 0.2)
        ay = random.uniform(-0.1, 0.1) * (1 + self.fatigue_factor * 0.2)
        az = 0.98 + random.uniform(-0.02, 0.02)  # Mostly gravity
        
        # Add movement-specific acceleration
        movement_factor = abs(self.direction * self.speed) / 10.0
        if self.exercise == 'squat':
            ay -= movement_factor  # Vertical movement
        elif self.exercise == 'pushup':
            az += movement_factor  # Forward/backward movement
        elif self.exercise == 'bicep_curl':
            ax += movement_factor * math.cos(math.radians(self.current_angle))
            ay += movement_factor * math.sin(math.radians(self.current_angle))
            
        return ax, ay, az
    
    def get_next_data(self) -> dict:
        """Generate next frame of demo data with realistic movement patterns"""
        if not self.running and not self.transition_state:
            return None
            
        params = self.exercise_params.get(self.exercise, {
            'min_angle': 0,
            'max_angle': 90,
            'speed': 2,
            'roll_range': (-5, 5)
        })
        
        # Handle transitions
        if self.transition_state:
            if self.transition_timer > 0:
                self.transition_timer -= 1
                # Gradually change angles during transition
                transition_factor = self.transition_timer / 10.0
                self.current_angle *= transition_factor
            else:
                self.transition_state = None
        
        # Update movement
        if self.running:
            self.current_angle += self.direction * params['speed']
            
            # Check for rep completion and direction changes
            if self.direction == 1 and self.current_angle >= params['max_angle']:
                self.direction = -1
                self.fatigue_factor = min(1.0, self.fatigue_factor + 0.1)
            elif self.direction == -1 and self.current_angle <= params['min_angle']:
                self.direction = 1
                self.rep_count += 1
                
        # Generate sensor data
        ax, ay, az = self._get_acceleration_data()
        roll = random.uniform(*params['roll_range']) * (1 + self.fatigue_factor * 0.3)
        
        # Update simulated heart rate
        self._update_heart_rate()
        
        # Calculate angular velocities based on movement
        gx = self._apply_natural_variation(self.direction * params['speed'] * 20)
        gy = self._apply_natural_variation(self.direction * params['speed'] * 15)
        gz = self._apply_natural_variation(self.direction * params['speed'] * 10)
        
        # Realistic beat detection based on heart rate
        current_time = time.time()
        beat_interval = 60.0 / self.heart_rate  # seconds between beats
        time_since_last_beat = current_time - self.last_beat_time
        
        beat_detected = False
        pulse_value = 512  # Base pulse value
        
        if time_since_last_beat >= beat_interval:
            beat_detected = True
            self.last_beat_time = current_time
            pulse_value = 800 + random.randint(-50, 50)  # Peak value on beat
        else:
            # Calculate pulse waveform between beats
            beat_phase = time_since_last_beat / beat_interval
            if beat_phase < 0.3:
                # Systolic peak
                pulse_value = 512 + int(300 * math.sin(beat_phase * math.pi / 0.3))
            elif beat_phase < 0.5:
                # Dicrotic notch
                pulse_value = 550 + int(50 * math.sin((beat_phase - 0.3) * math.pi / 0.2))
            else:
                # Diastole
                pulse_value = 512 + int(40 * (1 - (beat_phase - 0.5) / 0.5))
        
        # Add realistic noise to pulse signal
        pulse_value += random.randint(-10, 10)
        
        return {
            'ax': ax,
            'ay': ay,
            'az': az,
            'gx': gx,
            'gy': gy,
            'gz': gz,
            'pitch': self._apply_natural_variation(self.current_angle),
            'roll': roll,
            'yaw': random.uniform(-5, 5),
            'heartRate': int(self.heart_rate),
            'pulse': pulse_value,
            'beatDetected': beat_detected,
            'repCount': self.rep_count,
            'exercise': self.exercise
        }

class FormAnalyzer:
    """Real-time form analysis with mesh visualization"""
    
    def __init__(self):
        self.mesh = HumanMesh()
        self.demo_mode = DemoMode()
        self.thresholds = {
            'squat': {
                'min_depth': -40, 
                'max_depth': -90,
                'max_roll': 15,
                'ideal_tempo': 3.0,  # seconds per rep
                'tempo_range': 1.0   # allowed deviation
            },
            'pushup': {
                'min_depth': 20,
                'max_depth': 40,
                'max_roll': 15,
                'ideal_tempo': 2.0,
                'tempo_range': 0.5
            },
            'bicep_curl': {
                'min_curl': 60,
                'max_curl': 120,
                'max_roll': 10,
                'target_curl': 90,
                'ideal_tempo': 2.0,
                'tempo_range': 0.5
            }
        }
        self.rep_state = 'up'
        self.last_rep_count = 0
        self.current_form_score = 100
        self.current_feedback = []
        
        # Enhanced tracking
        self.movement_history = []  # Store recent movements
        self.last_rep_time = None
        self.rep_durations = []     # Track rep timing
        self.range_of_motion = {'min': 0, 'max': 0}  # Track ROM
    
    def analyze(self, exercise, pitch, roll, sensor_data=None):
        """Analyze form and detect reps with enhanced feedback"""
        score = 100
        feedback = []
        rep_detected = False

        # Only generate heart rate in demo mode or if not provided by sensor_data
        generate_heart_rate = self.demo_mode.running or (sensor_data and 'heartRate' not in sensor_data)
        
        if generate_heart_rate:
            self.demo_mode._update_heart_rate()

        # Update 3D mesh visualization
        self.mesh.update_joint_positions(pitch, roll, exercise)
        
        # Store movement data for temporal analysis
        self._update_movement_history(pitch, roll)
        
        # Get exercise-specific analysis
        if exercise == 'squat':
            score, feedback, rep_detected = self._analyze_squat(pitch, roll)
        elif exercise == 'pushup':
            score, feedback, rep_detected = self._analyze_pushup(pitch, roll)
        elif exercise == 'bicep_curl':
            score, feedback, rep_detected = self._analyze_bicep_curl(pitch, roll, sensor_data)
        else:
            return 0, ["Select an exercise to begin"], False
            
        # Add tempo-based feedback
        if sensor_data:
            tempo_feedback = self._analyze_movement_tempo(sensor_data)
            if tempo_feedback:
                feedback.extend(tempo_feedback)

        # Add stability analysis
        stability_score, stability_feedback = self._analyze_stability()
        if stability_feedback:
            feedback.extend(stability_feedback)
            score = min(score, stability_score)

        self.current_form_score = score
        self.current_feedback = feedback
        
        return score, feedback, rep_detected

    def _analyze_bicep_curl(self, pitch, roll, sensor_data=None):
        """Analyze bicep curl form with comprehensive feedback"""
        score = 100
        feedback = []
        rep_detected = False
        thresholds = self.thresholds['bicep_curl']
        
        # Analyze upward phase (curl)
        if self.rep_state == 'down' and pitch > thresholds['min_curl']:
            self.rep_state = 'up'
            
            # Check curl height
            if pitch > thresholds['max_curl']:
                feedback.append("⚠️ Too much curl - maintain control")
                score -= 15
            elif pitch >= thresholds['target_curl']:
                feedback.append("💪 Perfect curl height!")
                score = 100
            else:
                feedback.append("↑ Curl a bit higher")
                score = 85
            
            # Check curl speed
            if sensor_data and abs(sensor_data.get('gy', 0)) > 200:
                feedback.append("⚠ Slower, control the curl")
                score -= 15
            
            # Check momentum usage
            if sensor_data and abs(sensor_data.get('ax', 0)) > 0.5:
                feedback.append("⚠ Reduce body swing")
                score -= 20
        
        # Analyze downward phase (extension)
        elif self.rep_state == 'up' and pitch < 20:
            self.rep_state = 'down'
            rep_detected = True
            
            # Check extension
            if pitch > 5:
                feedback.append("↓ Extend arms fully")
                score -= 10
            else:
                feedback.append("✓ Good extension!")
            
            # Update rep metrics
            self._update_rep_metrics(datetime.now())
        
        # Analyze form stability
        roll_threshold = thresholds['max_roll']
        if abs(roll) > roll_threshold:
            score -= 20
            if roll > 0:
                feedback.append("⚠ Keep right arm steady")
            else:
                feedback.append("⚠ Keep left arm steady")
        
        # Analyze movement consistency
        if len(self.movement_history) >= 3:
            # Check for jerky movements
            pitch_changes = [abs(self.movement_history[i+1]['pitch'] - self.movement_history[i]['pitch']) 
                           for i in range(len(self.movement_history)-2)]
            if max(pitch_changes) > 20:
                feedback.append("⚠ Smooth out the movement")
                score -= 10
            
            # Check tempo
            if len(self.rep_durations) >= 2:
                avg_duration = sum(self.rep_durations[-2:]) / 2
                if avg_duration < thresholds['ideal_tempo'] - thresholds['tempo_range']:
                    feedback.append("⚠ Slow down for better form")
                    score -= 10
                elif avg_duration > thresholds['ideal_tempo'] + thresholds['tempo_range']:
                    feedback.append("⚠ Maintain steady pace")
                    score -= 5
        
        return score, feedback, rep_detected

    def _analyze_squat(self, pitch, roll):
        """Analyze squat form with detailed feedback"""
        score = 100
        feedback = []
        rep_detected = False
        thresholds = self.thresholds['squat']
        
        # Detect and analyze downward phase
        if self.rep_state == 'up' and pitch < -30:
            self.rep_state = 'down'
            
            # Depth analysis
            if pitch < thresholds['max_depth']:
                feedback.append("⚠️ Too deep - maintain control")
                score -= 15
            elif pitch < -50:
                feedback.append("🎯 Perfect depth!")
                score = 100
            elif pitch < thresholds['min_depth']:
                feedback.append("✓ Good depth - focus on control")
                score = 90
            else:
                feedback.append("⚠ Not deep enough - aim for parallel")
                score = 70
            
            # Check descent speed using gyro data
            if len(self.movement_history) >= 2:
                time_diff = (self.movement_history[-1]['timestamp'] - 
                           self.movement_history[-2]['timestamp']).total_seconds()
                if time_diff < 0.5:
                    feedback.append("⚠ Control the descent - slower")
                    score -= 10
        
        # Detect and analyze upward phase
        elif self.rep_state == 'down' and pitch > -10:
            self.rep_state = 'up'
            rep_detected = True
            
            # Check full extension
            if pitch < 0:
                feedback.append("⚠ Stand fully at the top")
                score -= 10
            else:
                feedback.append("✓ Good extension!")
            
            # Update rep metrics
            self._update_rep_metrics(datetime.now())
        
        # Analyze lateral stability
        if abs(roll) > thresholds['max_roll']:
            score -= 20
            if roll > 0:
                feedback.append("⚠ Leaning right - center weight")
            else:
                feedback.append("⚠ Leaning left - center weight")
        
        # Check range of motion consistency
        if rep_detected and self.last_rep_count > 0:
            current_rom = self.range_of_motion['max'] - self.range_of_motion['min']
            if current_rom < thresholds['min_depth'] * 0.8:
                feedback.append("⚠ Maintain consistent depth")
                score -= 15
        
        return score, feedback, rep_detected

    def _analyze_pushup(self, pitch, roll):
        """Analyze pushup form with detailed feedback"""
        score = 100
        feedback = []
        rep_detected = False
        thresholds = self.thresholds['pushup']
        
        # Analyze downward phase (lowering)
        if self.rep_state == 'up' and pitch > thresholds['min_depth']:
            self.rep_state = 'down'
            
            # Check chest dip depth
            if pitch > thresholds['max_depth']:
                feedback.append("⚠️ Too low - risk of shoulder strain")
                score -= 20
            elif pitch > thresholds['min_depth'] + 10:
                feedback.append("💪 Perfect depth!")
                score = 100
            else:
                feedback.append("↓ Lower chest a bit more")
                score = 85
            
            # Check shoulder alignment
            if abs(roll) > thresholds['max_roll']:
                feedback.append("⚠ Keep shoulders level")
                score -= 15
            
            # Analyze descent control
            if len(self.movement_history) >= 2:
                time_diff = (self.movement_history[-1]['timestamp'] - 
                           self.movement_history[-2]['timestamp']).total_seconds()
                if time_diff < 0.3:
                    feedback.append("⚠ Control the descent")
                    score -= 10
        
        # Analyze upward phase (pushing up)
        elif self.rep_state == 'down' and pitch < 5:
            self.rep_state = 'up'
            rep_detected = True
            
            # Check extension
            if pitch > 0:
                feedback.append("✓ Full extension - good!")
            else:
                feedback.append("↑ Push up completely")
                score -= 10
            
            # Update rep tracking
            self._update_rep_metrics(datetime.now())
        
        # Analyze body alignment throughout movement
        if len(self.movement_history) >= 3:
            recent_rolls = [m['roll'] for m in self.movement_history[-3:]]
            if any(abs(r) > thresholds['max_roll'] for r in recent_rolls):
                feedback.append("⚠ Keep body straight - check core")
                score -= 15
            
            # Check for consistent form
            pitch_variance = np.var([m['pitch'] for m in self.movement_history[-3:]])
            if pitch_variance > 100:
                feedback.append("⚠ Maintain steady pace")
                score -= 10
        
        return score, feedback, rep_detected

    def _update_movement_history(self, pitch, roll):
        """Update movement history buffer"""
        timestamp = datetime.now()
        self.movement_history.append({
            'pitch': pitch,
            'roll': roll,
            'timestamp': timestamp
        })
        # Keep only last 20 readings
        if len(self.movement_history) > 20:
            self.movement_history.pop(0)
        
        # Update range of motion
        self.range_of_motion['min'] = min(self.range_of_motion['min'], pitch)
        self.range_of_motion['max'] = max(self.range_of_motion['max'], pitch)

    def _analyze_movement_tempo(self, sensor_data):
        """Analyze movement tempo and smoothness"""
        feedback = []
        
        if len(self.movement_history) < 2:
            return feedback
            
        # Calculate movement speed from gyroscope data
        gy = abs(sensor_data.get('gy', 0))
        if gy > 200:
            feedback.append("⚠ Movement too fast - maintain control")
        elif gy < 50 and self.rep_state != 'rest':
            feedback.append("⚠ Movement too slow - maintain momentum")
            
        # Analyze rep timing if available
        if self.last_rep_time and len(self.rep_durations) > 0:
            avg_duration = sum(self.rep_durations) / len(self.rep_durations)
            if avg_duration < 1.5:
                feedback.append("⚠ Slow down your reps")
            elif avg_duration > 4.0:
                feedback.append("⚠ Speed up slightly")
                
        return feedback

    def _analyze_stability(self):
        """Analyze movement stability and consistency"""
        if len(self.movement_history) < 5:
            return 100, []
            
        # Calculate variance in pitch and roll
        pitch_values = [m['pitch'] for m in self.movement_history[-5:]]
        roll_values = [m['roll'] for m in self.movement_history[-5:]]
        
        pitch_variance = np.var(pitch_values)
        roll_variance = np.var(roll_values)
        
        feedback = []
        score = 100
        
        # Check for excessive movement variation
        if pitch_variance > 100:
            feedback.append("⚠ Stabilize your movement - too much variation")
            score -= 20
        if roll_variance > 50:
            feedback.append("⚠ Keep your form steady - reduce swaying")
            score -= 15
            
        return score, feedback

    def _update_rep_metrics(self, timestamp):
        """Update metrics when a rep is completed"""
        if self.last_rep_time:
            duration = (timestamp - self.last_rep_time).total_seconds()
            self.rep_durations.append(duration)
            # Keep only last 5 rep durations
            if len(self.rep_durations) > 5:
                self.rep_durations.pop(0)
                
        self.last_rep_time = timestamp
        self.range_of_motion = {'min': 0, 'max': 0}  # Reset ROM tracking

    def get_mesh_data(self):
        """Get current mesh visualization data"""
        return self.mesh.get_mesh_data()

    def start_demo(self, exercise):
        """Start demo mode"""
        self.demo_mode.start(exercise)
        return {"status": "demo_started", "exercise": exercise}
    
    def stop_demo(self):
        """Stop demo mode"""
        self.demo_mode.stop()
        return {"status": "demo_stopped"}
    
    def get_demo_data(self):
        """Get next frame of demo data"""
        return self.demo_mode.get_next_data()