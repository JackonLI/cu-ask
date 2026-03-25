import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Paper } from '@mui/material';

function App() {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { sender: 'You', text: message };
    setChatLog(prev => [...prev, userMessage]);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message })
      });
      const data = await response.json();
      setChatLog(prev => [...prev, { sender: 'CU-Ask Bot', text: data.reply }]);
    } catch (error) {
      setChatLog(prev => [...prev, { sender: 'System Error', text: 'Backend is not reachable!' }]);
    }
    
    setMessage('');
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '50px' }}>
      <Paper elevation={3} style={{ padding: '20px' }}>
        <Typography variant="h4" align="center" gutterBottom color="primary">
          CU-Ask Chatbot Demo
        </Typography>
        
        <Box style={{ height: '300px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
          {chatLog.map((log, index) => (
            <Typography key={index} align={log.sender === 'You' ? 'right' : 'left'} color={log.sender === 'System Error' ? 'error' : 'textPrimary'}>
              <b>{log.sender}:</b> {log.text}
            </Typography>
          ))}
        </Box>

        <Box display="flex" gap={2}>
          <TextField 
            fullWidth 
            variant="outlined" 
            label="Type your message..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' ? sendMessage() : null}
          />
          <Button variant="contained" color="primary" onClick={sendMessage}>
            Send
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default App;
