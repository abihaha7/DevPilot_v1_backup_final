/**
 * DevPilot Google Auth Service
 * 
 * Handles Google authentication via Firebase
 * Stores user progress, streaks, and learning metrics
 * Optional: enables Gmail notifications
 */

import * as vscode from "vscode";
import { getLogger } from "./logger";

const logger = getLogger("GoogleAuthService");

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  createdAt: number;
}

export interface LearningProgress {
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  completedLessons: string[];
  practiceProblems: number;
  averageScore: number;
  lastActiveAt: number;
}

export interface UserState {
  profile: UserProfile | null;
  progress: LearningProgress;
  preferencesOptin: {
    emailNotifications: boolean;
    gmailIntegration: boolean;
    authToken?: string;
  };
}

/**
 * Google Auth Service (Firebase Integration)
 * 
 * Manages authentication and user state
 * Note: Firebase initialization requires additional setup
 */
export class GoogleAuthService {
  private context: vscode.ExtensionContext;
  private userState: UserState;
  private readonly STORAGE_KEY = "devpilot.userState";

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.userState = this.loadUserState();
  }

  /**
   * Load user state from extension storage
   */
  private loadUserState(): UserState {
    const stored = this.context.globalState.get<UserState>(this.STORAGE_KEY);
    if (stored) {
      return stored;
    }

    return {
      profile: null,
      progress: {
        totalMinutes: 0,
        currentStreak: 0,
        longestStreak: 0,
        completedLessons: [],
        practiceProblems: 0,
        averageScore: 0,
        lastActiveAt: Date.now(),
      },
      preferencesOptin: {
        emailNotifications: false,
        gmailIntegration: false,
      },
    };
  }

  /**
   * Save user state to extension storage
   */
  private async saveUserState(): Promise<void> {
    await this.context.globalState.update(this.STORAGE_KEY, this.userState);
  }

  /**
   * Sign in with Google (opens browser for OAuth)
   * This is a simplified implementation - full Firebase setup needed
   */
  async signInWithGoogle(): Promise<UserProfile | null> {
    try {
      // TODO: Integrate with Firebase Auth SDK
      // For now, show a prompt for demo purposes
      const proceed = await vscode.window.showInformationMessage(
        "DevPilot: Sign in with Google to track your learning progress",
        { modal: true },
        "Sign In"
      );

      if (!proceed) {
        return null;
      }

      // In production, this would open a browser for OAuth flow
      // Example: await firebaseAuth.signInWithPopup(googleProvider)

      logger.info("Google sign-in initiated (Firebase setup required)");
      vscode.window.showInformationMessage(
        "✨ Google Sign-In: Firebase integration required. See documentation."
      );

      return null;
    } catch (error) {
      logger.error("Google sign-in failed", { error: String(error) });
      vscode.window.showErrorMessage(
        "Failed to sign in with Google. See logs for details."
      );
      return null;
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    this.userState.profile = null;
    this.userState.preferencesOptin.authToken = undefined;
    await this.saveUserState();
    logger.info("User signed out");
    vscode.window.showInformationMessage("✅ Signed out successfully");
  }

  /**
   * Get current user profile
   */
  getUserProfile(): UserProfile | null {
    return this.userState.profile;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.userState.profile !== null;
  }

  /**
   * Track learning activity
   * Updates progress metrics
   */
  async trackActivity(activityType: string, duration: number): Promise<void> {
    const progress = this.userState.progress;

    // Update total minutes
    progress.totalMinutes += duration;

    // Update streak
    const lastActive = progress.lastActiveAt;
    const now = Date.now();
    const daysDiff = (now - lastActive) / (1000 * 60 * 60 * 24);

    if (daysDiff <= 1) {
      // Same day or next day - maintain streak
      progress.currentStreak = Math.max(1, progress.currentStreak);
    } else if (daysDiff > 1) {
      // Streak broken
      progress.currentStreak = 1;
    }

    progress.lastActiveAt = now;

    if (progress.currentStreak > progress.longestStreak) {
      progress.longestStreak = progress.currentStreak;
    }

    await this.saveUserState();
    logger.info("Activity tracked", { activityType, duration, streak: progress.currentStreak });
  }

  /**
   * Record completed lesson
   */
  async recordLessonCompletion(lessonId: string): Promise<void> {
    const progress = this.userState.progress;
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
      await this.saveUserState();
      logger.info("Lesson completed", { lessonId });
    }
  }

  /**
   * Record practice problem attempt
   */
  async recordPracticeProblem(score: number): Promise<void> {
    const progress = this.userState.progress;
    progress.practiceProblems += 1;

    // Update rolling average
    const total = progress.practiceProblems;
    progress.averageScore =
      (progress.averageScore * (total - 1) + score) / total;

    await this.saveUserState();
    logger.info("Practice problem recorded", { score, average: progress.averageScore });
  }

  /**
   * Get learning progress
   */
  getProgress(): LearningProgress {
    return this.userState.progress;
  }

  /**
   * Get achievement badges
   */
  getAchievements(): string[] {
    const progress = this.userState.progress;
    const achievements: string[] = [];

    if (progress.totalMinutes >= 60) {
      achievements.push("first_hour");
    }
    if (progress.totalMinutes >= 300) {
      achievements.push("5_hours");
    }
    if (progress.totalMinutes >= 1000) {
      achievements.push("1000_minutes");
    }
    if (progress.currentStreak >= 7) {
      achievements.push("week_streak");
    }
    if (progress.currentStreak >= 30) {
      achievements.push("month_streak");
    }
    if (progress.completedLessons.length >= 5) {
      achievements.push("5_lessons");
    }
    if (progress.completedLessons.length >= 20) {
      achievements.push("20_lessons");
    }
    if (progress.practiceProblems >= 10) {
      achievements.push("10_problems");
    }
    if (progress.averageScore >= 0.9) {
      achievements.push("high_scorer");
    }

    return achievements;
  }

  /**
   * Enable email notifications
   */
  async enableEmailNotifications(): Promise<void> {
    if (!this.isAuthenticated()) {
      vscode.window.showWarningMessage(
        "Sign in to enable email notifications"
      );
      return;
    }

    this.userState.preferencesOptin.emailNotifications = true;
    await this.saveUserState();
    vscode.window.showInformationMessage(
      "📧 Email notifications enabled"
    );
  }

  /**
   * Enable Gmail integration for notifications
   */
  async enableGmailIntegration(): Promise<void> {
    if (!this.isAuthenticated()) {
      vscode.window.showWarningMessage(
        "Sign in to enable Gmail integration"
      );
      return;
    }

    // TODO: Implement Gmail API integration
    this.userState.preferencesOptin.gmailIntegration = true;
    await this.saveUserState();
    vscode.window.showInformationMessage(
      "📬 Gmail integration enabled (requires Gmail API setup)"
    );
  }
}
