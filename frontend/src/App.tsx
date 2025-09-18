import {  Routes, Route } from "react-router-dom";

import './App.css'
import  Header  from "./components/header";
import  Footer  from "./components/footer";
import HomePage from "./pages/Home";
import CompareGrid from "./pages/Equipments/compareGrid";

function App() {
 

  return (
    <>
    <Header/>
    <main className="max-w-[1780px] mx-auto px-6 py-6 min-h-[90vh]">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/equipment/:id" element={<CompareGrid />} />
      </Routes>
    </main>
    <Footer/>
  </>
  )
}

export default App
