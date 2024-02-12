// Methods exposed by AssemblyScript Compiler
// Requires "--exportStart" and "--exportRuntime" compiler options
export const init = "_start";                   // Initializes the instance on the RuntimeMemory
export const pin = "__pin";                     // Pins an object to be ignored by the garbage collector
export const collect = "__collect";             // Performs a full garbage collection

// Variables / Methods added before compilation
export const instance = "__self__";             // Pointer name that references the instance of the user defined class
export const instantiate = "Instantiate";       // Creates a new instance of the user defined class
export const start = "Start";                   // Calls the Start method of the user defined class
export const update = "Update";                 // Calls the Update method of the user defined class
export const scriptEnd = "ScriptEnd";           // Calls the Update method of the user defined class