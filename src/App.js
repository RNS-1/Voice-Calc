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
  const [showNotes, setShowNotes] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

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
      .replace(/sqrt/g, 'sqrt(')
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
      .replace(/one/g, '1')
      .replace(/two/g, '2')
      .replace(/three/g, '3')
      .replace(/four/g, '4')
      .replace(/five/g, '5')
      .replace(/six/g, '6')
      .replace(/seven/g, '7')
      .replace(/eight/g, '8')
      .replace(/nine/g, '9')
      .replace(/ten/g, '10')
      .replace(/percent/g, '%')

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
      const amount = extractNumber(input);
      
      if (!amount) {
        return "Please specify an amount to convert.";
      }
      
      // Dollar to other currencies
      if (input.includes('dollar') || input.includes('usd')) {
        if (input.includes('euro') || input.includes('eur')) {
          return `${amount} USD is approximately ${(amount * 0.85).toFixed(2)} EUR`;
        } else if (input.includes('rupee') || input.includes('inr')) {
          return `${amount} USD is approximately ${(amount * 76.5).toFixed(2)} INR`;
        } else if (input.includes('yuan') || input.includes('cny')) {
          return `${amount} USD is approximately ${(amount * 6.45).toFixed(2)} CNY`;
        } else if (input.includes('pound') || input.includes('gbp')) {
          return `${amount} USD is approximately ${(amount * 0.72).toFixed(2)} GBP`;
        } else if (input.includes('yen') || input.includes('jpy')) {
          return `${amount} USD is approximately ${(amount * 110.5).toFixed(2)} JPY`;
        }
      }
      
      // Euro to other currencies
      else if (input.includes('euro') || input.includes('eur')) {
        if (input.includes('dollar') || input.includes('usd')) {
          return `${amount} EUR is approximately ${(amount * 1.18).toFixed(2)} USD`;
        } else if (input.includes('rupee') || input.includes('inr')) {
          return `${amount} EUR is approximately ${(amount * 90.1).toFixed(2)} INR`;
        } else if (input.includes('yuan') || input.includes('cny')) {
          return `${amount} EUR is approximately ${(amount * 7.6).toFixed(2)} CNY`;
        } else if (input.includes('pound') || input.includes('gbp')) {
          return `${amount} EUR is approximately ${(amount * 0.85).toFixed(2)} GBP`;
        } else if (input.includes('yen') || input.includes('jpy')) {
          return `${amount} EUR is approximately ${(amount * 130.2).toFixed(2)} JPY`;
        }
      }
      
      // Rupee to other currencies
      else if (input.includes('rupee') || input.includes('inr')) {
        if (input.includes('dollar') || input.includes('usd')) {
          return `${amount} INR is approximately ${(amount * 0.013).toFixed(2)} USD`;
        } else if (input.includes('euro') || input.includes('eur')) {
          return `${amount} INR is approximately ${(amount * 0.011).toFixed(2)} EUR`;
        } else if (input.includes('yuan') || input.includes('cny')) {
          return `${amount} INR is approximately ${(amount * 0.084).toFixed(2)} CNY`;
        } else if (input.includes('pound') || input.includes('gbp')) {
          return `${amount} INR is approximately ${(amount * 0.0094).toFixed(2)} GBP`;
        } else if (input.includes('yen') || input.includes('jpy')) {
          return `${amount} INR is approximately ${(amount * 1.44).toFixed(2)} JPY`;
        }
      }
      
      // Yuan to other currencies
      else if (input.includes('yuan') || input.includes('cny')) {
        if (input.includes('dollar') || input.includes('usd')) {
          return `${amount} CNY is approximately ${(amount * 0.155).toFixed(2)} USD`;
        } else if (input.includes('euro') || input.includes('eur')) {
          return `${amount} CNY is approximately ${(amount * 0.131).toFixed(2)} EUR`;
        } else if (input.includes('rupee') || input.includes('inr')) {
          return `${amount} CNY is approximately ${(amount * 11.86).toFixed(2)} INR`;
        } else if (input.includes('pound') || input.includes('gbp')) {
          return `${amount} CNY is approximately ${(amount * 0.112).toFixed(2)} GBP`;
        } else if (input.includes('yen') || input.includes('jpy')) {
          return `${amount} CNY is approximately ${(amount * 17.13).toFixed(2)} JPY`;
        }
      }
      
      // Pound to other currencies
      else if (input.includes('pound') || input.includes('gbp')) {
        if (input.includes('dollar') || input.includes('usd')) {
          return `${amount} GBP is approximately ${(amount * 1.39).toFixed(2)} USD`;
        } else if (input.includes('euro') || input.includes('eur')) {
          return `${amount} GBP is approximately ${(amount * 1.18).toFixed(2)} EUR`;
        } else if (input.includes('rupee') || input.includes('inr')) {
          return `${amount} GBP is approximately ${(amount * 106.4).toFixed(2)} INR`;
        } else if (input.includes('yuan') || input.includes('cny')) {
          return `${amount} GBP is approximately ${(amount * 8.96).toFixed(2)} CNY`;
        } else if (input.includes('yen') || input.includes('jpy')) {
          return `${amount} GBP is approximately ${(amount * 153.5).toFixed(2)} JPY`;
        }
      }
      
      // Yen to other currencies
      else if (input.includes('yen') || input.includes('jpy')) {
        if (input.includes('dollar') || input.includes('usd')) {
          return `${amount} JPY is approximately ${(amount * 0.0091).toFixed(4)} USD`;
        } else if (input.includes('euro') || input.includes('eur')) {
          return `${amount} JPY is approximately ${(amount * 0.0077).toFixed(4)} EUR`;
        } else if (input.includes('rupee') || input.includes('inr')) {
          return `${amount} JPY is approximately ${(amount * 0.69).toFixed(2)} INR`;
        } else if (input.includes('yuan') || input.includes('cny')) {
          return `${amount} JPY is approximately ${(amount * 0.058).toFixed(3)} CNY`;
        } else if (input.includes('pound') || input.includes('gbp')) {
          return `${amount} JPY is approximately ${(amount * 0.0065).toFixed(4)} GBP`;
        }
      }
      
      return "I can convert between USD, EUR, INR, CNY, GBP, and JPY. Please specify which currencies.";
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

  const toggleNotes = () => {
    setShowNotes(!showNotes);
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

  // Handle chat input
  const handleChatInput = (e) => {
    if (e.key === 'Enter') {
      const message = e.target.value;
      if (message.trim()) {
        setChatMessages(prev => [...prev, { sender: 'user', text: message }]);
        e.target.value = '';

        // Simulate bot response
        setTimeout(() => {
          setChatMessages(prev => [...prev, { sender: 'bot', text: `Echo: ${message}` }]);
        }, 500);
      }
    }
  };

  const notesContent = {
    scientific: {
      title: "Scientific Calculator Guide",
      sections: [
        {
          title: "Basic Operations",
          examples: [
            "2 + 3 = 5",
            "10 - 5 = 5",
            "4 * 5 = 20",
            "20 / 4 = 5"
          ]
        },
        {
          title: "Scientific Functions",
          examples: [
            "sin(30) = 0.5 (in degrees mode)",
            "cos(60) = 0.5 (in degrees mode)",
            "tan(45) = 1 (in degrees mode)",
            "log(100) = 2 (base 10)",
            "sqrt(16) = 4",
            "2^3 = 8"
          ]
        },
        {
          title: "Voice Commands",
          examples: [
            "Say: 'two plus three'",
            "Say: 'sine of thirty degrees'",
            "Say: 'square root of sixteen'",
            "Say: 'log of one hundred'",
            "Say: 'five to the power of three'",
            "Say: 'cosine of sixty degrees'"
          ]
        }
      ]
    },
    area: {
      title: "Area Calculator Guide",
      sections: [
        {
          title: "Shapes & Formulas",
          examples: [
            "Square: side² = area",
            "Rectangle: length × width = area",
            "Circle: π × radius² = area",
            "Triangle: (base × height) ÷ 2 = area",
            "Trapezoid: ((a + b) × height) ÷ 2 = area",
            "Ellipse: π × a × b = area"
          ]
        },
        {
          title: "Voice Commands",
          examples: [
            "Say: 'area of square with side 5'",
            "Say: 'area of rectangle with length 4 and width 7'",
            "Say: 'area of circle with radius 3'",
            "Say: 'area of triangle with base 6 and height 8'",
            "Say: 'area of trapezoid with a 5 b 7 height 4'",
            "Say: 'area of ellipse with a 5 and b 3'"
          ]
        }
      ]
    },
    money: {
      title: "Money Calculator Guide",
      sections: [
        {
          title: "Currency Conversion",
          examples: [
            "USD to EUR: $1 ≈ €0.93",
            "EUR to USD: €1 ≈ $1.08",
            "USD to GBP: $1 ≈ £0.79",
            "USD to JPY: $1 ≈ ¥151.67"
          ]
        },
        {
          title: "Financial Calculations",
          examples: [
            "Simple Interest: Principal × Rate × Time",
            "Compound Interest: P(1 + r)^t",
            "Loan Payment: Principal × (r(1+r)^n)/((1+r)^n-1)",
            "Discount: Price × Discount Rate"
          ]
        },
        {
          title: "Voice Commands",
          examples: [
            "Say: 'convert 100 dollars to euros'",
            "Say: 'convert 50 euros to dollars'",
            "Say: 'calculate 5% interest on 1000 for 2 years'",
            "Say: 'what is 20% of 80 dollars'"
          ]
        }
      ]
    }
  };

  return (
    <div className={`min-h-screen ${getThemeClass('bg-gray-900 text-white', 'bg-gray-100 text-gray-800')} flex items-center justify-center p-4`}>
      {/* Notes Modal (Documentation) */}
      {showNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg shadow-lg ${getThemeClass('bg-gray-800', 'bg-white')}`}>
            <div className={`p-4 flex justify-between items-center ${getThemeClass('bg-gray-700', 'bg-gray-200')} border-b ${getThemeClass('border-gray-600', 'border-gray-300')}`}>
              <h2 className="text-xl font-bold">{notesContent[calculationType].title}</h2>
              <button 
                onClick={toggleNotes}
                className={`p-2 rounded-full ${getThemeClass('bg-gray-600 hover:bg-gray-500', 'bg-gray-300 hover:bg-gray-400')}`}
              >
                ✕
              </button>
            </div>
            
            <div className="p-5">
              {notesContent[calculationType].sections.map((section, idx) => (
                <div key={idx} className="mb-6">
                  <h3 className={`text-lg font-medium mb-3 ${getThemeClass('text-gray-300', 'text-gray-700')}`}>
                    {section.title}
                  </h3>
                  <div className={`rounded-lg p-4 ${getThemeClass('bg-gray-700', 'bg-gray-200')}`}>
                    {section.examples.map((example, i) => (
                      <div 
                        key={i} 
                        className={`py-2 px-3 ${i % 2 === 0 ? getThemeClass('bg-gray-800 bg-opacity-50', 'bg-gray-100') : ''} rounded my-1`}
                      >
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="mt-5 p-4 rounded-lg border border-dashed border-opacity-50 text-sm italic text-center">
                Tip: Click the voice button (🎤) and speak your calculation clearly for best results.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${getThemeClass('bg-gray-800', 'bg-gray-200')}`}>
        {/* Calculator Header */}
        <div className={`p-4 flex justify-between items-center ${getThemeClass('bg-gray-700', 'bg-gray-300')}`}>
          <h2 className="text-lg font-bold">RNS Voice Calculator</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleNotes}
              className={`p-2 rounded-full ${getThemeClass('bg-gray-600 text-white', 'bg-gray-400 text-gray-800')}`}
              title="Documentation"
            >
              📋
            </button>
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full ${getThemeClass('bg-gray-600 text-white', 'bg-gray-400 text-gray-800')}`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        
        {/* Display Screen */}
        <div className={`p-4 ${getThemeClass('bg-gray-900', 'bg-gray-100')}`}>
          {/* Input Display */}
          <div className={`mb-2 p-3 font-mono rounded ${getThemeClass('bg-gray-800 text-gray-200', 'bg-white text-gray-800')}`}>
            {manualInput || transcript || "0"}
          </div>
          
          {/* Result Display */}
          <div className={`p-3 text-right text-2xl font-bold rounded ${getThemeClass('bg-gray-800', 'bg-white')}`}>
            {processingAnimation ? (
              <div className="flex justify-end items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            ) : (
              <span className={getThemeClass('text-gray-100', 'text-gray-800')}>{result || "0"}</span>
            )}
          </div>
        </div>
        
        {/* Calculator Type Tabs */}
        <div className="grid grid-cols-3 border-b border-gray-700">
          {['scientific', 'area', 'money'].map((type) => (
            <button 
              key={type}
              className={`py-2 text-center capitalize ${
                calculationType === type 
                  ? getThemeClass('bg-gray-700 text-white', 'bg-gray-400 text-white') 
                  : getThemeClass('bg-gray-800 text-gray-400', 'bg-gray-300 text-gray-600')
              }`}
              onClick={() => setCalculationType(type)}
            >
              {type}
            </button>
          ))}
        </div>     
        {/* Scientific Functions Row */}
        {calculationType === 'scientific' && showScientificKeypad && (
          <div className={`grid grid-cols-4 gap-1 p-2 ${getThemeClass('bg-gray-800', 'bg-gray-300')}`}>
            {scientificFunctions.map((func, index) => (
              <button
                key={index}
                onClick={() => insertOperation(func.insertValue)}
                className={`p-3 text-center rounded ${getThemeClass('bg-gray-700 hover:bg-gray-600', 'bg-gray-400 hover:bg-gray-500')} transition-colors`}
              >
                {func.symbol}
              </button>
            ))}
          </div>
        )}
        
        {/* Main Keypad */}
        <div className={`grid grid-cols-4 gap-1 p-2 ${getThemeClass('bg-gray-800', 'bg-gray-300')}`}>
          {basicKeypadButtons.map((button, index) => (
            <button
              key={index}
              onClick={() => handleKeypadButtonClick(button.value)}
              className={`p-4 text-center text-lg font-medium rounded ${
                button.symbol === '=' 
                  ? getThemeClass('bg-gray-600 hover:bg-gray-500', 'bg-gray-500 hover:bg-gray-600') + ' text-white' 
                  : ['÷', '×', '-', '+'].includes(button.symbol)
                    ? getThemeClass('bg-gray-700 hover:bg-gray-600', 'bg-gray-400 hover:bg-gray-500')
                    : getThemeClass('bg-gray-900 hover:bg-gray-700', 'bg-white hover:bg-gray-200')
              }`}
            >
              {button.symbol}
            </button>
          ))}
        </div>
        
        {/* Voice Control & Clear */}
        <div className={`flex p-3 ${getThemeClass('bg-gray-700', 'bg-gray-300')}`}>
          <button 
            className={`flex-1 py-3 mr-1 rounded flex items-center justify-center ${
              listening 
                ? 'bg-gray-500 text-white' 
                : getThemeClass('bg-gray-600 hover:bg-gray-500', 'bg-gray-400 hover:bg-gray-500')
            } text-white transition-colors`}
            onClick={startListening}
            disabled={listening}
          >
            <span className="text-xl mr-2">🎤</span>
            <span>{listening ? 'Listening...' : 'Voice'}</span>
          </button>
          
          <button 
            className={`flex-1 py-3 ml-1 rounded ${getThemeClass('bg-gray-600 hover:bg-gray-500', 'bg-gray-400 hover:bg-gray-500')} text-white transition-colors`}
            onClick={clearCalculator}
          >
            Clear
          </button>
        </div>
        
        {/* History Toggle */}
        <div className={`p-2 ${getThemeClass('bg-gray-800', 'bg-gray-200')} border-t border-gray-700`}>
          <button
            className={`w-full py-2 text-center text-sm ${getThemeClass('text-gray-400 hover:text-gray-300', 'text-gray-600 hover:text-gray-800')}`}
            onClick={() => document.getElementById('history-panel').classList.toggle('hidden')}
          >
            History ▾
          </button>
        </div>
        
        {/* History Panel (Hidden by default) */}
        <div id="history-panel" className="hidden">
          <div className={`max-h-48 overflow-y-auto ${getThemeClass('bg-gray-900', 'bg-white')}`}>
            {history.length === 0 ? (
              <p className={`p-4 ${getThemeClass('text-gray-500', 'text-gray-400')}`}>No calculations yet</p>
            ) : (
              history.map((item, index) => (
                <div key={index} className={`p-3 ${index % 2 === 0 ? getThemeClass('bg-gray-800', 'bg-gray-100') : ''} border-b border-gray-700`}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm truncate">{item.input}</p>
                    <span className={`text-xs ${getThemeClass('text-gray-500', 'text-gray-400')}`}>{item.timestamp}</span>
                  </div>
                  <p className="font-medium">{item.result}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AICalculator;
