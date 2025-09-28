import React from 'react'
import Overlay from './Overlay'

function home() {
  return (
     <>
        <div className="relative h-screen w-full z-0">
            <div className="w-screen h-screen bg-contain bg-center fixed inset-0 z-0 "
         style={{ backgroundImage: "url('/background.jpg')" }}>
          
        </div>
        </div>
        <Overlay />
        
     </>
  )
}

export default home