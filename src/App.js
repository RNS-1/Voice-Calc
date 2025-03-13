import React, { useState, useEffect } from 'react';
import * as math from 'mathjs';

const AICalculator = () => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState([]);
  const [calculationType, setCalculationType] = useState('scientific');
  const [processingAnimation, setProcessingAnimation] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [showScientificKeypad, setShowScientificKeypad] = useState(false);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const input = event.results[0][0].transcript;
        setTranscript(input);
        setProcessingAnimation(true);
        
        // Simulate AI processing time
        setTimeout(() => {
          processVoiceInput(input);
          setProcessingAnimation(false);
        }, 800);
      };

      recognition.onend = () => {
        setListening(false);
      };

      window.recognition = recognition;
    }
  }, []);

  // Process voice input and determine calculation type
  const processVoiceInput = (input) => {
    // Convert to lowercase for easier detection
    const lowerInput = input.toLowerCase();
    
    try {
      let calculatedResult = '';
      
      // Check for area calculations
      if (lowerInput.includes('area') || lowerInput.includes('square') || 
          lowerInput.includes('rectangle') || lowerInput.includes('circle') || 
          lowerInput.includes('triangle')) {
        calculatedResult = calculateArea(lowerInput);
      } 
      // Check for currency/money calculations
      else if (lowerInput.includes('dollar') || lowerInput.includes('euro') || 
               lowerInput.includes('pound') || lowerInput.includes('yen') || 
               lowerInput.includes('money') || lowerInput.includes('currency')) {
        calculatedResult = calculateMoney(lowerInput);
      }
      // Default to scientific calculation
      else {
        calculatedResult = calculateScientific(lowerInput);
      }
      
      setResult(calculatedResult);
      speakResult(calculatedResult);
      
      // Add to history
      setHistory(prev => [...prev, { input, result: calculatedResult, timestamp: new Date().toLocaleTimeString() }]);
    } catch (error) {
      const errorMessage = "I couldn't process that calculation. Please try rephrasing.";
      setResult(errorMessage);
      speakResult(errorMessage);
    }
  };

  // Process manual input
  const processManualInput = () => {
    if (!manualInput.trim()) return;
    
    setProcessingAnimation(true);
    
    // Simulate AI processing time
    setTimeout(() => {
      try {
        let calculatedResult = '';
        
        if (calculationType === 'area') {
          calculatedResult = calculateArea(manualInput);
        } else if (calculationType === 'money') {
          calculatedResult = calculateMoney(manualInput);
        } else {
          calculatedResult = calculateScientific(manualInput);
        }
        
        setResult(calculatedResult);
        
        // Add to history
        setHistory(prev => [...prev, { 
          input: manualInput, 
          result: calculatedResult, 
          timestamp: new Date().toLocaleTimeString(),
          isManual: true
        }]);
      } catch (error) {
        setResult("Invalid input. Please check your expression and try again.");
      }
      
      setProcessingAnimation(false);
    }, 400);
  };

  // Scientific calculations (algebra, trigonometry, etc.)
  const calculateScientific = (input) => {
    // For manual input in scientific mode, just evaluate directly
    if (calculationType === 'scientific' && !input.includes(' ')) {
      try {
        return String(math.evaluate(input));
      } catch (e) {
        // If direct evaluation fails, continue with word processing
      }
    }
    
    // Replace words with operators for voice or text input
    let processedInput = input
      .replace(/plus/g, '+')
      .replace(/minus/g, '-')
      .replace(/times/g, '*')
      .replace(/multiplied by/g, '*')
      .replace(/divided by/g, '/')
      .replace(/to the power of/g, '^')
      .replace(/squared/g, '^2')
      .replace(/cubed/g, '^3')
      .replace(/square root of/g, 'sqrt(')
      .replace(/cubic root of/g, 'cbrt(')
      .replace(/sine of/g, 'sin(')
      .replace(/cosine of/g, 'cos(')
      .replace(/tangent of/g, 'tan(')
      .replace(/cosecant of/g, 'csc(')
      .replace(/secant of/g, 'sec(')
      .replace(/cotangent of/g, 'cot(')
      .replace(/arctangent of/g, 'atan(')
      .replace(/arcsine of/g, 'asin(')
      .replace(/arccosine of/g, 'acos(')
      .replace(/logarithm of/g, 'log10(')
      .replace(/natural log of/g, 'log(')
      .replace(/factorial of/g, 'factorial(')
      .replace(/absolute value of/g, 'abs(')
      .replace(/floor of/g, 'floor(')
      .replace(/ceiling of/g, 'ceil(')
      .replace(/round/g, 'round(')
      .replace(/modulo/g, '%')
      .replace(/degrees/g, 'deg')
      .replace(/radians/g, 'rad')
      .replace(/pi/g, 'PI');
    
    // Close any open parentheses
    const openParenCount = (processedInput.match(/\(/g) || []).length;
    const closeParenCount = (processedInput.match(/\)/g) || []).length;
    if (openParenCount > closeParenCount) {
      processedInput += ')'.repeat(openParenCount - closeParenCount);
    }
    
    try {
      // Try evaluating as is (for manual input expressions)
      const result = math.evaluate(processedInput);
      return result.toString();
    } catch (e) {
      // If that fails, try extracting numbers and operators
      try {
        const extractedMath = processedInput.match(/[+\-*/^%.\d()]|sin|cos|tan|log|sqrt|PI/g)?.join('') || '';
        if (extractedMath) {
          const result = math.evaluate(extractedMath);
          return result.toString();
        }
      } catch (ex) {
        // One more fallback - try removing all non-math characters
        try {
          const sanitizedInput = processedInput.replace(/[^+\-*/^%.\d()]/g, '');
          if (sanitizedInput) {
            const result = math.evaluate(sanitizedInput);
            return result.toString();
          }
        } catch (ex2) {
          throw new Error("Couldn't calculate");
        }
      }
    }
    
    throw new Error("No mathematical expression found");
  };

  // Area calculations
  const calculateArea = (input) => {
    if (input.includes('square')) {
      const side = extractNumber(input, 'side') || extractNumber(input);
      if (side) {
        return `${side * side} square units`;
      }
    } else if (input.includes('rectangle')) {
      const length = extractNumber(input, 'length');
      const width = extractNumber(input, 'width');
      if (length && width) {
        return `${length * width} square units`;
      }
    } else if (input.includes('circle')) {
      const radius = extractNumber(input, 'radius') || extractNumber(input);
      if (radius) {
        return `${(Math.PI * radius * radius).toFixed(2)} square units`;
      }
    } else if (input.includes('triangle')) {
      const base = extractNumber(input, 'base');
      const height = extractNumber(input, 'height');
      if (base && height) {
        return `${(0.5 * base * height).toFixed(2)} square units`;
      }
    } else if (input.includes('trapezoid')) {
      const a = extractNumber(input, 'a') || extractNumber(input, 'first');
      const b = extractNumber(input, 'b') || extractNumber(input, 'second');
      const height = extractNumber(input, 'height') || extractNumber(input, 'h');
      if (a && b && height) {
        return `${(0.5 * (a + b) * height).toFixed(2)} square units`;
      }
    } else if (input.includes('ellipse')) {
      const a = extractNumber(input, 'a') || extractNumber(input, 'semi-major');
      const b = extractNumber(input, 'b') || extractNumber(input, 'semi-minor');
      if (a && b) {
        return `${(Math.PI * a * b).toFixed(2)} square units`;
      }
    }
    
    throw new Error("Couldn't calculate area. Please specify shape and dimensions.");
  };

  // Money calculations
  const calculateMoney = (input) => {
    // Simple currency conversion
    if (input.includes('convert')) {
      // This is a simplified example. In a real app, you'd use current exchange rates
      if (input.includes('dollar') && input.includes('euro')) {
        const amount = extractNumber(input);
        if (amount) {
          return `${amount} USD is approximately ${(amount * 0.85).toFixed(2)} EUR`;
        }
      } else if (input.includes('euro') && input.includes('dollar')) {
        const amount = extractNumber(input);
        if (amount) {
          return `${amount} EUR is approximately ${(amount * 1.18).toFixed(2)} USD`;
        }
      }
    }
    
    // Interest calculation
    if (input.includes('interest')) {
      const principal = extractNumber(input, 'principal') || extractNumber(input);
      const rate = extractNumber(input, 'rate') || extractNumber(input, 'percent');
      const time = extractNumber(input, 'year') || extractNumber(input, 'time');
      
      if (principal && rate) {
        const timeValue = time || 1;
        const interest = principal * (rate/100) * timeValue;
        return `Interest: ${interest.toFixed(2)}, Total: ${(principal + interest).toFixed(2)}`;
      }
    }
    
    // Default to basic math if specific money calculation not found
    return calculateScientific(input);
  };

  // Helper function to extract numbers from voice input
  const extractNumber = (input, keyword = '') => {
    const words = input.split(' ');
    
    if (keyword) {
      // Find keyword and get the number after it
      const keywordIndex = words.findIndex(word => word.includes(keyword));
      if (keywordIndex !== -1 && keywordIndex < words.length - 1) {
        const numberStr = words[keywordIndex + 1];
        const number = parseFloat(numberStr);
        if (!isNaN(number)) return number;
      }
    }
    
    // Try to extract any number
    for (let word of words) {
      const number = parseFloat(word);
      if (!isNaN(number)) return number;
    }
    
    return null;
  };

  // Start listening for voice input
  const startListening = () => {
    if (window.recognition) {
      setListening(true);
      window.recognition.start();
    } else {
      setResult("Voice recognition not supported in this browser.");
    }
  };

  // Speak the result
  const speakResult = (text) => {
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(text);
      speech.volume = 1;
      speech.rate = 1;
      speech.pitch = 1;
      window.speechSynthesis.speak(speech);
    }
  };

  // Clear calculator state
  const clearCalculator = () => {
    setTranscript('');
    setResult('');
    setManualInput('');
  };

  // Handle input change for manual input
  const handleInputChange = (e) => {
    setManualInput(e.target.value);
  };

  // Handle key press for manual input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      processManualInput();
    }
  };

  // Insert scientific operation into manual input
  const insertOperation = (operation) => {
    setManualInput(prev => prev + operation);
  };

  // Toggle theme
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // Dynamic styles based on theme
  const getThemeClass = (darkClass, lightClass) => {
    return darkMode ? darkClass : lightClass;
  };

  // Scientific keypad functions
  const scientificFunctions = [
    { symbol: 'sin()', insertValue: 'sin(' },
    { symbol: 'cos()', insertValue: 'cos(' },
    { symbol: 'tan()', insertValue: 'tan(' },
    { symbol: 'log10()', insertValue: 'log10(' },
    { symbol: 'ln()', insertValue: 'log(' },
    { symbol: 'sqrt()', insertValue: 'sqrt(' },
    { symbol: 'cbrt()', insertValue: 'cbrt(' },
    { symbol: 'pi', insertValue: 'PI' },
    { symbol: 'e', insertValue: 'e' },
    { symbol: '^', insertValue: '^' },
    { symbol: '!', insertValue: '!' },
    { symbol: '%', insertValue: '%' },
    { symbol: '(', insertValue: '(' },
    { symbol: ')', insertValue: ')' },
    { symbol: 'abs()', insertValue: 'abs(' },
    { symbol: 'exp()', insertValue: 'exp(' },
  ];

  // Basic keypad buttons
  const basicKeypadButtons = [
    { symbol: '7', value: '7' },
    { symbol: '8', value: '8' },
    { symbol: '9', value: '9' },
    { symbol: '÷', value: '/' },
    { symbol: '4', value: '4' },
    { symbol: '5', value: '5' },
    { symbol: '6', value: '6' },
    { symbol: '×', value: '*' },
    { symbol: '1', value: '1' },
    { symbol: '2', value: '2' },
    { symbol: '3', value: '3' },
    { symbol: '-', value: '-' },
    { symbol: '0', value: '0' },
    { symbol: '.', value: '.' },
    { symbol: '=', value: '=' },
    { symbol: '+', value: '+' },
  ];

  // Handle keypad button click
  const handleKeypadButtonClick = (value) => {
    if (value === '=') {
      processManualInput();
    } else {
      setManualInput(prev => prev + value);
    }
  };

  return (
    <div className={`flex flex-col min-h-screen ${getThemeClass('bg-gray-900 text-white', 'bg-gray-100 text-gray-800')}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-0 w-full h-full opacity-20 ${darkMode ? 'opacity-30' : 'opacity-10'}`}>
          {Array(20).fill().map((_, i) => (
            <div 
              key={i}
              className={`absolute rounded-full ${getThemeClass('bg-blue-500', 'bg-blue-400')}`}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 200 + 50}px`,
                height: `${Math.random() * 200 + 50}px`,
                opacity: Math.random() * 0.3,
                filter: 'blur(40px)',
                animation: `float ${Math.random() * 10 + 10}s infinite linear`
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto p-6 relative z-10 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">AI Voice Calculator</h1>
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full ${getThemeClass('bg-gray-700 text-white', 'bg-white text-gray-800')} shadow`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Calculator Panel */}
          <div className={`rounded-xl shadow-xl overflow-hidden mb-6 ${getThemeClass('bg-gray-800', 'bg-white')}`}>
            {/* Tab Navigation */}
            <div className="flex mb-2 border-b border-opacity-20 border-gray-500">
              <button 
                className={`flex-1 py-3 px-4 font-medium transition-colors ${calculationType === 'scientific' 
                  ? getThemeClass('bg-blue-600 text-white', 'bg-blue-500 text-white') 
                  : getThemeClass('bg-gray-800 text-gray-300', 'bg-gray-100 text-gray-600')}`}
                onClick={() => setCalculationType('scientific')}
              >
                Scientific
              </button>
              <button 
                className={`flex-1 py-3 px-4 font-medium transition-colors ${calculationType === 'area' 
                  ? getThemeClass('bg-blue-600 text-white', 'bg-blue-500 text-white') 
                  : getThemeClass('bg-gray-800 text-gray-300', 'bg-gray-100 text-gray-600')}`}
                onClick={() => setCalculationType('area')}
              >
                Area
              </button>
              <button 
                className={`flex-1 py-3 px-4 font-medium transition-colors ${calculationType === 'money' 
                  ? getThemeClass('bg-blue-600 text-white', 'bg-blue-500 text-white') 
                  : getThemeClass('bg-gray-800 text-gray-300', 'bg-gray-100 text-gray-600')}`}
                onClick={() => setCalculationType('money')}
              >
                Money
              </button>
            </div>
            
            {/* Manual Input */}
            <div className={`p-6 ${getThemeClass('bg-gray-800 bg-opacity-90', 'bg-white')}`}>
              <p className={`mb-2 ${getThemeClass('text-gray-400', 'text-gray-500')}`}>Manual Input:</p>
              <div className="flex">
                <input
                  type="text"
                  value={manualInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className={`flex-1 p-3 rounded-l border ${getThemeClass('bg-gray-700 border-gray-600 text-white', 'bg-white border-gray-300 text-gray-800')}`}
                  placeholder={calculationType === 'scientific' ? "Enter expression (e.g. 2+3*4)" : 
                              calculationType === 'area' ? "e.g. area of circle with radius 5" :
                              "e.g. convert 100 dollars to euros"}
                />
                <button
                  onClick={processManualInput}
                  className={`px-4 rounded-r font-medium ${getThemeClass('bg-blue-600 hover:bg-blue-500', 'bg-blue-500 hover:bg-blue-400')} text-white`}
                >
                  Calculate
                </button>
              </div>
              
              {/* Toggle Scientific Keypad */}
              {calculationType === 'scientific' && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowScientificKeypad(!showScientificKeypad)}
                    className={`text-sm py-1 px-3 rounded ${getThemeClass('bg-gray-700 hover:bg-gray-600', 'bg-gray-200 hover:bg-gray-300')}`}
                  >
                    {showScientificKeypad ? 'Hide Keypad' : 'Show Keypad'}
                  </button>
                </div>
              )}
            </div>
            
            {/* Scientific Keypad */}
            {showScientificKeypad && calculationType === 'scientific' && (
              <div className={`p-4 ${getThemeClass('bg-gray-800', 'bg-gray-100')}`}>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {scientificFunctions.map((func, index) => (
                    <button
                      key={index}
                      onClick={() => insertOperation(func.insertValue)}
                      className={`p-2 text-center rounded ${getThemeClass('bg-gray-700 hover:bg-gray-600', 'bg-white hover:bg-gray-200')} transition-colors`}
                    >
                      {func.symbol}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {basicKeypadButtons.map((button, index) => (
                    <button
                      key={index}
                      onClick={() => handleKeypadButtonClick(button.value)}
                      className={`p-3 text-center rounded ${button.symbol === '=' 
                        ? getThemeClass('bg-blue-600 hover:bg-blue-500', 'bg-blue-500 hover:bg-blue-400') + ' text-white' 
                        : getThemeClass('bg-gray-700 hover:bg-gray-600', 'bg-white hover:bg-gray-200')}`}
                    >
                      {button.symbol}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Voice Input Display */}
            <div className={`p-6 ${getThemeClass('bg-gray-800 bg-opacity-70', 'bg-gray-100')}`}>
              <p className={`mb-2 ${getThemeClass('text-gray-400', 'text-gray-500')}`}>Voice Input:</p>
              <div className="flex items-center">
                <p className="font-medium text-lg">{transcript || "Speak after clicking the microphone button"}</p>
                {listening && (
                  <div className="ml-4 flex space-x-1">
                    <div className="w-2 h-6 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-8 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Result Display */}
            <div className={`p-6 ${getThemeClass('bg-gray-900 bg-opacity-70', 'bg-blue-50')}`}>
              <p className={`mb-2 ${getThemeClass('text-gray-400', 'text-gray-500')}`}>Result:</p>
              <div className="min-h-16 flex items-center">
                {processingAnimation ? (
                  <div className="flex items-center">
                    <div className="mr-3">Processing</div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                ) : (
                  <p className={`font-bold text-2xl ${result ? getThemeClass('text-blue-400', 'text-blue-600') : ''}`}>
                    {result || "Result will appear here"}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Control Buttons */}
          <div className="flex gap-4 mb-8 justify-center">
            <button 
              className={`p-6 rounded-full ${listening 
                ? 'bg-red-500 text-white' 
                : getThemeClass('bg-blue-600 hover:bg-blue-500', 'bg-blue-500 hover:bg-blue-400')} text-white shadow-lg transition-colors`}
              onClick={startListening}
              disabled={listening}
            >
              <div className="flex items-center">
                <span className="text-2xl mr-2">🎤</span>
                <span>{listening ? 'Listening...' : 'Speak'}</span>
              </div>
            </button>
            
            <button 
              className={`p-6 rounded-full ${getThemeClass('bg-gray-700 hover:bg-gray-600', 'bg-gray-200 hover:bg-gray-300')} shadow transition-colors`}
              onClick={clearCalculator}
            >
              <div className="flex items-center">
                <span className="text-xl mr-2">🗑️</span>
                <span>Clear</span>
              </div>
            </button>
          </div>
          
          {/* History and Help Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* History Section */}
            <div className={`${getThemeClass('bg-gray-800', 'bg-white')} rounded-xl shadow-lg overflow-hidden`}>
              <div className="p-4 font-medium border-b border-opacity-20 border-gray-500">
                <h2 className="text-lg">Calculation History</h2>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {history.length === 0 ? (
                  <p className={`p-4 ${getThemeClass('text-gray-400', 'text-gray-500')}`}>No calculations yet</p>
                ) : (
                  history.map((item, index) => (
                    <div key={index} className={`p-4 ${index % 2 === 0 ? getThemeClass('bg-gray-700 bg-opacity-30', 'bg-gray-50') : ''}`}>
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-sm ${getThemeClass('text-gray-400', 'text-gray-600')}`}>
                          {item.isManual ? '⌨️' : '🎤'} {item.input}
                        </p>
                        <span className={`text-xs ${getThemeClass('text-gray-500', 'text-gray-400')}`}>{item.timestamp}</span>
                      </div>
                      <p className={`font-medium ${getThemeClass('text-blue-400', 'text-blue-600')}`}>{item.result}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Help Panel */}
            <div className={`${getThemeClass('bg-gray-800', 'bg-white')} rounded-xl shadow-lg overflow-hidden`}>
              <div className="p-4 font-medium border-b border-opacity-20 border-gray-500">
                <h2 className="text-lg">Help & Examples</h2>
              </div>
              
              <div className="p-4">
                {calculationType === 'scientific' && (
                  <div>
                    <h3 className={`font-medium mb-2 ${getThemeClass('text-blue-400', 'text-blue-600')}`}>Scientific Calculations:</h3>
                    <p className="mb-2 text-sm">Type expressions directly or use the keypad. For voice, try:</p>
                    <ul className={`text-sm ${getThemeClass('text-gray-300', 'text-gray-700')} space-y-1`}>
                      <li>"2 plus 3 minus 1"</li>
                      <li>"sine of 30 degrees"</li>
                      <li>"square root of 16"</li>
                      <li>"log of 100"</li>
                      <li>"5 to the power of 3"</li>
                      <li>"factorial of 5"</li>
                      <li>"absolute value of -10"</li>
                    </ul>
                  </div>
                )}
                
                {calculationType === 'area' && (
                  <div>
                    <h3 className={`font-medium mb-2 ${getThemeClass('text-blue-400', 'text-blue-600')}`}>Area Calculations:</h3>
                    <ul className={`text-sm ${getThemeClass('text-gray-300', 'text-gray-700')} space-y-1`}>
                      <li>"area of square with side 5"</li>
                      <li>"area of rectangle with length 4 and width 7"</li>
                      <li>"area of circle with radius 3"</li>
                      <li>"area of triangle with base 6 and height 8"</li>
                      <li>"area of trapezoid with a 5 b 7 height 4"</li>
                      <li>"area of ellipse with a 5 and b 3"</li>
                    </ul>
                  </div>
                )}
                
                {calculationType === 'money' && (
                  <div>
                    <h3 className={`font-medium mb-2 ${getThemeClass('text-blue-400', 'text-blue-600')}`}>Money Calculations:</h3>
                    <ul className={`text-sm ${getThemeClass('text-gray-300', 'text-gray-700')} space-y-1`}>
                      <li>"convert 100 dollars to euros"</li>
                      <li>"convert 50 euros to dollars"</li>
                      <li>"calculate 5% interest on 100 for 2 years"</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AICalculator;