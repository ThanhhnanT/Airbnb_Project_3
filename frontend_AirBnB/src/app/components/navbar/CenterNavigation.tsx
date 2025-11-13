
const CenterNavigation = () => {
  return (
    <div className="hidden md:flex items-center space-x-8">
            <button className="relative py-6 text-[15px] font-medium text-[hsl(var(--text-primary))] hover:text-[hsl(var(--text-primary))] transition-colors">
              <div className="flex items-center gap-2 bg-red-300">
                {/* <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="w-6 h-6">
                  <path d="M26 2v4h-3V4h-4V2h7zm-3 10V6h3v6h-3zm0 8V14h3v6h-3zm3 4h-3v6h3v-6zm-17 0h-7v-4H0v4h2v6h7v-6zm14-20h-5v2h5V4zm-9 0H9v2h5V4zm0 4H9v2h5V8zm0 4H9v2h5v-2zm0 4H9v2h5v-2zm0 4H9v2h5v-2zm0 4H9v2h5v-2zm0 4H9v2h5v-2zm14 2h-5v-2h5v2zm0-4h-5v-2h5v2z" fill="currentColor"/>
                </svg> */}
                Homes
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[hsl(var(--text-primary))] rounded-t-sm"></div>
            </button>
            
            {/* <button className="relative py-6 text-[15px] text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="w-6 h-6">
                <path d="M16 1c2 0 3.46.96 4.75 3.27L24 10l2 3 1 3v1l-1 3-3 5-3 4-4 2h-2l-4-2-3-4-3-5-1-3v-1l1-3 2-3 3.25-5.73C12.54 1.96 14 1 16 1zm0 2c-1.2 0-2.1.6-3 2L9.5 10 8 13l-1 2v1l1 2 2 4 3 3 3 2h2l3-2 3-3 2-4 1-2v-1l-1-2-1.5-3-3.5-5c-.9-1.4-1.8-2-3-2z" fill="currentColor"/>
              </svg>
              Experiences
              <span className="px-2 py-0.5 text-[10px] font-semibold text-white bg-blue-600 rounded-md">NEW</span>
            </button>
            
            <button className="relative py-6 text-[15px] text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="w-6 h-6">
                <path d="M16 1a15 15 0 0 1 11 24.5A15 15 0 0 1 5 25.5 15 15 0 0 1 16 1zm0 2a13 13 0 1 0 0 26 13 13 0 0 0 0-26zm3 5a5 5 0 0 1 4.5 7.2l-.2.3L19 20v5h-2v-5h-2v5h-2v-5l-4.3-4.5-.2-.3a5 5 0 0 1 3.3-7.2H19z" fill="currentColor"/>
              </svg>
              Services
              <span className="px-2 py-0.5 text-[10px] font-semibold text-white bg-blue-600 rounded-md">NEW</span>
            </button> */}
    </div>
  )
}

export default CenterNavigation