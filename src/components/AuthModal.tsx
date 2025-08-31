import { useState } from 'react';
import { Box, Modal, TextField, Button, Tabs, Tab, Alert } from '@mui/material';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '../Data/firebase';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: boolean) => {
    setIsLogin(newValue);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Tabs value={isLogin} onChange={handleTabChange} centered>
          <Tab label="Login" value={true} />
          <Tab label="Sign Up" value={false} />
        </Tabs>
        <Box component="form" sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
            {isLogin ? 'Login' : 'Sign Up'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
