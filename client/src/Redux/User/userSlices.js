import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../axiosConfig'; // Import the axios instance
import Cookies from 'js-cookie';

const initialState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
  users: [],
};

export const loginUser = createAsyncThunk('user/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(`/auth/login`, credentials);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data.error || error.message); // Ensure error message is passed
  }
});

export const signupUser = createAsyncThunk('user/signup', async (newUser, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(`/auth/signup`, newUser);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data.message || error.message);
  }
});

export const logoutUser = createAsyncThunk('user/logout', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(`/auth/logout`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data.message || error.message);
  }
});

export const fetchUsers = createAsyncThunk('users/fetchUsers', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/auth/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error.message);
    return rejectWithValue(error.response.data.message || error.message);
  }
});

export const updateUser = createAsyncThunk('users/updateUser', async (userData, { rejectWithValue }) => {
  const { id, fullName, password, email, mobile, counterNumber } = userData;
  try {
    const response = await axiosInstance.put(`/auth/users/update/${id}`, { fullName, password, email, mobile, counterNumber });
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error.message);
    return rejectWithValue(error.response.data.message || error.message);
  }
});

export const deleteUser = createAsyncThunk('users/deleteUser', async (id, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.delete(`/auth/users/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error.message);
    return rejectWithValue(error.response.data.message || error.message);
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    clearUser(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        localStorage.setItem('token', action.payload.accessToken);
        Cookies.set('accessToken', action.payload.accessToken); 
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(signupUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(logoutUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = 'succeeded';
        state.user = null;
        state.token = null;
        localStorage.removeItem('token');
        Cookies.remove('accessToken');
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const updatedUser = action.payload;
        const existingUser = state.users.find((user) => user._id === updatedUser._id);
        if (existingUser) {
          Object.assign(existingUser, updatedUser);
        }
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        const deletedUserId = action.payload._id;
        state.users = state.users.filter((user) => user._id !== deletedUserId);
      });
  },
});

export const { setUser, clearUser } = userSlice.actions;

export default userSlice.reducer;
