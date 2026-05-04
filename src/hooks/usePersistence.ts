import * as React from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs, orderBy } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { toast } from 'sonner';

export function usePersistence(user: User | null) {
  const [documents, setDocuments] = React.useState<any[]>([]);
  const [activeDocId, setActiveDocId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'documents'),
      where('ownerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setDocuments(docs);
      
      // If we don't have an active doc, pick the first one or create one
      if (!activeDocId && docs.length > 0) {
        setActiveDocId(docs[0].id);
      }
    }, (error) => {
      console.error('Firestore Error:', error);
    });

    return () => unsubscribe();
  }, [user, activeDocId]);

  const saveDocument = async (docId: string, data: any) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'documents', docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to sync changes');
    }
  };

  const createDocument = async (title: string, content: any) => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'documents'), {
        ownerId: user.uid,
        title,
        content,
        sources: [],
        versions: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setActiveDocId(docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('Failed to create document');
    }
  };

  return { documents, activeDocId, setActiveDocId, saveDocument, createDocument };
}
