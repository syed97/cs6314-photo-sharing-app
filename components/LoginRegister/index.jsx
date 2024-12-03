import React, { useState, useContext, useEffect } from "react";
import { Button, TextField, Typography, Grid, Paper, Alert } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../../context/LoginContext";


function LoginRegister() {
  const {setIsLoggedIn, setFirstName, setLoginId} = useContext(LoginContext); // for login state and top bar name setting

  const [isRegistering, setIsRegistering] = useState(false);
  // login + registration fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // registration specific fields
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstNameInput] = useState("");
  const [lastName, setLastName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [occupation, setOccupation] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const navigate = useNavigate(); // init useNavigate hook

    // Handle login submission
    const handleLogin = async () => {
        axios.post("/admin/login", { login_name: username, password: password })
        .then((response) => {
          if (response.status === 200) {
            setIsLoggedIn(true);
            setFirstName(response.data.first_name);
            setLoginId(response.data._id);
            navigate(`/users/${response.data._id}`);
          }
        })
        .catch((error) => {
          console.error("Error Logging In:", error);
          setErrorMessage("User not found. Please try logging in again.");
        });
    };

    // Clear registration form fields
    const clearRegistrationFields = () => {
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setFirstNameInput("");
      setLastName("");
      setLocation("");
      setDescription("");
      setOccupation("");
    };

    // Handle registration submission
    const handleRegister = async () => {
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }
  
      const newUser = {
        first_name: firstName,
        last_name: lastName,
        location,
        description,
        occupation,
        login_name: username,
        password,
      };
  
      axios
        .post("/user", newUser)
        .then((response) => {
          if (response.status === 200) {
            setSuccessMessage("Registration successful! You can now log in.");
            clearRegistrationFields();
          }
        })
        .catch((error) => {
          if (error.response && error.response.data && error.response.data.errorMessage) {
            console.error("Error registering:", error.response.data.errorMessage);
            setErrorMessage(error.response.data.errorMessage); // Display backend error message
          } else {
            console.error("Error registering:", error.message);
            setErrorMessage("Registration failed. Please try again.");
          }
        });
    };

    // for clearing the alert message
    useEffect(() => {
      if (successMessage || errorMessage) {
        const timeoutId = setTimeout(() => {
          setSuccessMessage(null);
          setErrorMessage(null);
        }, 5000); // Close after 3 seconds
  
        return () => clearTimeout(timeoutId); // Clear timeout on unmount
      }
      return undefined;
    }, [successMessage, errorMessage]);
  
    return (
      <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
        <Typography variant="h5">{isRegistering ? "Register" : "Login"}</Typography>
        <Grid container spacing={2} style={{ marginTop: "10px" }}>
          {isRegistering && (
            <>
              <Grid item xs={12}>
                <TextField
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstNameInput(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Occupation"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  fullWidth
                />
              </Grid>
            </>
          )}
          <Grid item xs={12}>
            <TextField
              label="Login Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
          </Grid>
          {isRegistering && (
            <Grid item xs={12}>
              <TextField
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
              />
            </Grid>
          )}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={isRegistering ? handleRegister : handleLogin}
              fullWidth
            >
              {isRegistering ? "Register User" : "Login"}
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="text"
              color="secondary"
              onClick={() => {
                setIsRegistering(!isRegistering);
                clearRegistrationFields();
              }}
            >
              {isRegistering
                ? "Already have an account? Login"
                : "New user? Register"}
            </Button>
          </Grid>
          <Grid item xs={12}>
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            {successMessage && <Alert severity="success">{successMessage}</Alert>}
          </Grid>
        </Grid>
      </Paper>
    );
  }

export default LoginRegister;
