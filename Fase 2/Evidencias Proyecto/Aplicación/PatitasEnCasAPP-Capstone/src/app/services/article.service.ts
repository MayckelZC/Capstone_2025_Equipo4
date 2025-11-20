import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Article } from '../models/Article';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

  constructor(private firestore: AngularFirestore) { }

  getArticles(): Observable<Article[]> {
    return this.firestore.collection<Article>('articles').valueChanges({ idField: 'id' });
  }

  addArticle(article: Omit<Article, 'id' | 'createdAt'>): Promise<any> {
    const newArticle = { ...article, createdAt: new Date() };
    return this.firestore.collection('articles').add(newArticle);
  }

  getArticle(id: string): Observable<Article | undefined> {
    return this.firestore.collection<Article>('articles').doc(id).valueChanges();
  }

  updateArticle(id: string, article: Partial<Article>): Promise<void> {
    return this.firestore.collection('articles').doc(id).update(article);
  }

  deleteArticle(id: string): Promise<void> {
    return this.firestore.collection('articles').doc(id).delete();
  }
}
