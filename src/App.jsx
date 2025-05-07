import { useEffect, useState } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from './firebase-config';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const docRef = doc(db, "user", "nBpqvRYV40vWok0GaoLS")
  
  const getData = async () => {
    const docSnap = await getDoc(docRef);
    console.log(docSnap.data());
  }

  useEffect(() => {
    getData();
  }, [])

  return (
    <>
      <h1 className="text-red-500 font-bold align-middle text-center m-5">Hello this is my project</h1>
    </>
  )
}

export default App
