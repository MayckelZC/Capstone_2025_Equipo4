/*
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { SuccessStory } from '../models/SuccessStory';

@Injectable({
  providedIn: 'root'
})
export class SuccessStoryService {

  constructor(private firestore: AngularFirestore) { }

  getSuccessStories(): Observable<SuccessStory[]> {
    return this.firestore.collection<SuccessStory>('successStories').valueChanges({ idField: 'id' });
  }

  addSuccessStory(story: Omit<SuccessStory, 'id' | 'createdAt'>): Promise<any> {
    const newStory = { ...story, createdAt: new Date() };
    return this.firestore.collection('successStories').add(newStory);
  }

  getSuccessStory(id: string): Observable<SuccessStory | undefined> {
    return this.firestore.collection<SuccessStory>('successStories').doc(id).valueChanges();
  }

  updateSuccessStory(id: string, story: Partial<SuccessStory>): Promise<void> {
    return this.firestore.collection('successStories').doc(id).update(story);
  }

  deleteSuccessStory(id: string): Promise<void> {
    return this.firestore.collection('successStories').doc(id).delete();
  }
}
*/
