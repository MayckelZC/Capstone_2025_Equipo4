import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Rating {
  id?: string;
  fromUserId: string;
  toUserId: string;
  adoptionId?: string;
  score: number; // 1-5
  comment?: string;
  createdAt: Date;
  fromUserName?: string;
  fromUserAvatar?: string;
}

export interface Comment {
  id?: string;
  adoptionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  likes: number;
  likedBy: string[];
  replies?: Comment[];
  parentCommentId?: string;
}

export interface UserStats {
  userId: string;
  totalRatings: number;
  averageRating: number;
  ratingsBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  totalAdoptions: number;
  totalComments: number;
  memberSince: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SocialService {
  constructor(private firestore: AngularFirestore) {}

  // SISTEMA DE RATINGS
  async submitRating(rating: Omit<Rating, 'id' | 'createdAt'>): Promise<void> {
    try {
      // Verificar que no existe un rating previo del mismo usuario para la misma adopción
      const existingRating = await this.firestore.collection('ratings', ref =>
        ref.where('fromUserId', '==', rating.fromUserId)
           .where('toUserId', '==', rating.toUserId)
           .where('adoptionId', '==', rating.adoptionId || '')
      ).get().toPromise();

      if (!existingRating?.empty) {
        throw new Error('Ya has calificado a este usuario para esta adopción');
      }

      await this.firestore.collection('ratings').add({
        ...rating,
        createdAt: new Date()
      });

      // Actualizar estadísticas del usuario
      await this.updateUserStats(rating.toUserId);
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw error;
    }
  }

  async updateRating(ratingId: string, updates: Partial<Rating>): Promise<void> {
    try {
      await this.firestore.collection('ratings').doc(ratingId).update(updates);
      
      // Si se actualiza el score, recalcular estadísticas
      if (updates.score !== undefined) {
        const rating = await this.firestore.collection('ratings').doc(ratingId).get().toPromise();
        const ratingData = rating?.data() as Rating;
        if (ratingData) {
          await this.updateUserStats(ratingData.toUserId);
        }
      }
    } catch (error) {
      console.error('Error updating rating:', error);
      throw error;
    }
  }

  getUserRatings(userId: string): Observable<Rating[]> {
    return this.firestore.collection<Rating>('ratings', ref =>
      ref.where('toUserId', '==', userId)
         .orderBy('createdAt', 'desc')
    ).valueChanges({ idField: 'id' });
  }

  getUserAverageRating(userId: string): Observable<number> {
    return this.getUserRatings(userId).pipe(
      map(ratings => {
        if (ratings.length === 0) return 0;
        const total = ratings.reduce((sum, rating) => sum + rating.score, 0);
        return Math.round((total / ratings.length) * 100) / 100;
      })
    );
  }

  private async updateUserStats(userId: string): Promise<void> {
    try {
      const ratings = await this.firestore.collection<Rating>('ratings', ref =>
        ref.where('toUserId', '==', userId)
      ).get().toPromise();

      if (ratings) {
        const ratingsData = ratings.docs.map(doc => doc.data());
        const totalRatings = ratingsData.length;
        const averageRating = totalRatings > 0 ? 
          ratingsData.reduce((sum, r) => sum + r.score, 0) / totalRatings : 0;

        const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratingsData.forEach(rating => {
          breakdown[rating.score as keyof typeof breakdown]++;
        });

        await this.firestore.collection('user_stats').doc(userId).set({
          userId,
          totalRatings,
          averageRating: Math.round(averageRating * 100) / 100,
          ratingsBreakdown: breakdown,
          lastUpdated: new Date()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  // SISTEMA DE COMENTARIOS
  async addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'likes' | 'likedBy'>): Promise<string> {
    try {
      const docRef = await this.firestore.collection('comments').add({
        ...comment,
        createdAt: new Date(),
        likes: 0,
        likedBy: []
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  async addReply(
    parentCommentId: string,
    reply: Omit<Comment, 'id' | 'createdAt' | 'likes' | 'likedBy' | 'parentCommentId'>
  ): Promise<string> {
    try {
      const docRef = await this.firestore.collection('comments').add({
        ...reply,
        parentCommentId,
        createdAt: new Date(),
        likes: 0,
        likedBy: []
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  }

  getComments(adoptionId: string): Observable<Comment[]> {
    return this.firestore.collection<Comment>('comments', ref =>
      ref.where('adoptionId', '==', adoptionId)
         .where('parentCommentId', '==', null)
         .orderBy('createdAt', 'desc')
    ).valueChanges({ idField: 'id' }).pipe(
      map(comments => {
        // Cargar respuestas para cada comentario
        return Promise.all(comments.map(async comment => {
          const replies = await this.getCommentReplies(comment.id!).toPromise();
          return { ...comment, replies: replies || [] };
        }));
      }),
      switchMap(promise => promise)
    );
  }

  private getCommentReplies(commentId: string): Observable<Comment[]> {
    return this.firestore.collection<Comment>('comments', ref =>
      ref.where('parentCommentId', '==', commentId)
         .orderBy('createdAt', 'asc')
    ).valueChanges({ idField: 'id' });
  }

  async toggleCommentLike(commentId: string, userId: string): Promise<void> {
    try {
      const commentRef = this.firestore.collection('comments').doc(commentId);
      const commentDoc = await commentRef.get().toPromise();
      
      if (commentDoc?.exists) {
        const comment = commentDoc.data() as Comment;
        const likedBy = comment.likedBy || [];
        const hasLiked = likedBy.includes(userId);

        if (hasLiked) {
          // Quitar like
          await commentRef.update({
            likes: Math.max(0, comment.likes - 1),
            likedBy: likedBy.filter(id => id !== userId)
          });
        } else {
          // Agregar like
          await commentRef.update({
            likes: comment.likes + 1,
            likedBy: [...likedBy, userId]
          });
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      const commentDoc = await this.firestore.collection('comments').doc(commentId).get().toPromise();
      
      if (commentDoc?.exists) {
        const comment = commentDoc.data() as Comment;
        
        if (comment.userId !== userId) {
          throw new Error('No tienes permiso para eliminar este comentario');
        }

        // Eliminar respuestas primero
        const replies = await this.firestore.collection('comments', ref =>
          ref.where('parentCommentId', '==', commentId)
        ).get().toPromise();

        if (replies) {
          const batch = this.firestore.firestore.batch();
          replies.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }

        // Eliminar comentario principal
        await this.firestore.collection('comments').doc(commentId).delete();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  // ESTADÍSTICAS Y REPORTES
  getUserStats(userId: string): Observable<UserStats | null> {
    return this.firestore.collection<UserStats>('user_stats').doc(userId)
      .valueChanges({ idField: 'userId' });
  }

  async generateUserReport(userId: string): Promise<any> {
    try {
      const [ratings, comments, adoptions] = await Promise.all([
        this.getUserRatings(userId).pipe(take(1)).toPromise(),
        this.getUserComments(userId).pipe(take(1)).toPromise(),
        this.getUserAdoptions(userId).pipe(take(1)).toPromise()
      ]);

      return {
        totalRatings: ratings?.length || 0,
        averageRating: ratings?.length ? 
          ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length : 0,
        totalComments: comments?.length || 0,
        totalAdoptions: adoptions?.length || 0,
        recentActivity: {
          ratings: ratings?.slice(0, 5) || [],
          comments: comments?.slice(0, 5) || []
        }
      };
    } catch (error) {
      console.error('Error generating user report:', error);
      throw error;
    }
  }

  private getUserComments(userId: string): Observable<Comment[]> {
    return this.firestore.collection<Comment>('comments', ref =>
      ref.where('userId', '==', userId)
         .orderBy('createdAt', 'desc')
    ).valueChanges({ idField: 'id' });
  }

  private getUserAdoptions(userId: string): Observable<any[]> {
    return this.firestore.collection('mascotas', ref =>
      ref.where('creadorId', '==', userId)
    ).valueChanges({ idField: 'id' });
  }

  // FUNCIONALIDADES DE MODERACIÓN
  async reportContent(
    contentType: 'rating' | 'comment',
    contentId: string,
    reporterId: string,
    reason: string,
    description?: string
  ): Promise<void> {
    try {
      await this.firestore.collection('content_reports').add({
        contentType,
        contentId,
        reporterId,
        reason,
        description,
        status: 'pending',
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error reporting content:', error);
      throw error;
    }
  }

  // CONFIGURACIÓN Y PREFERENCIAS
  async updateUserSocialPreferences(
    userId: string,
    preferences: {
      allowRatings?: boolean;
      allowComments?: boolean;
      publicProfile?: boolean;
      showStats?: boolean;
    }
  ): Promise<void> {
    try {
      await this.firestore.collection('user_social_preferences').doc(userId).set(
        preferences,
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating social preferences:', error);
      throw error;
    }
  }
}

// Importar switchMap y take que faltan
import { switchMap, take } from 'rxjs/operators';