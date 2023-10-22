package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var db = make(map[string]string)

// Create the JWT key used to create the signature
var jwtKey = []byte("my_secret_key")

// For simplification, we're storing the users information as an in-memory map in our code
var users = map[string]User{
	// "user1": "password1",
	// "user2": "password2",
	"user1": {
		Username: "user1",
		Password: "password1",
		UserRole: WelcomeRole,
	},
	"user2": {
		Username: "user2",
		Password: "password2",
		UserRole: CreateRole,
	},
}

// Create a struct to read the username and password from the request body
type Credentials struct {
	Password string `json:"password"`
	Username string `json:"username"`
}

// Create a struct that will be encoded to a JWT.
// We add jwt.RegisteredClaims as an embedded type, to provide fields like expiry time
type Claims struct {
	Username string `json:"username"`
	UserRole Role   `json:"role"`
	jwt.RegisteredClaims
}

type Role string

const (
	WelcomeRole = "welcome-role"
	CreateRole  = "create-role"
)

type Right string

const (
	WelcomeRight = "welcome-right"
	CreateRight  = "create-right"
)

type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
	UserRole Role
}

var RolesMap = map[Role][]Right{
	WelcomeRole: {WelcomeRight},
	CreateRole:  {CreateRight},
}

func login(c *gin.Context) {
	var user User
	// Get the JSON body and decode into credentials
	err := json.NewDecoder(c.Request.Body).Decode(&user)
	if err != nil {
		// If the structure of the body is wrong, return an HTTP error
		c.Writer.WriteHeader(http.StatusBadRequest)
		return
	}

	expectedUser, ok := users[user.Username]

	if !ok || expectedUser.Password != user.Password {
		c.Writer.WriteHeader(http.StatusUnauthorized)
		return
	}

	expirationTime := time.Now().Add(time.Minute * 5)

	claims := &Claims{
		Username: user.Username,
		UserRole: expectedUser.UserRole,
		RegisteredClaims: jwt.RegisteredClaims{
			// In JWT, the expiry time is expressed as unix milliseconds
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	//Create JWT string
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		// If there is an error in creating the JWT return an internal server error
		c.Writer.WriteHeader(http.StatusInternalServerError)
		return
	}

	c.SetCookie("token", tokenString, int(expirationTime.Unix()), "/", "localhost", false, true)
	c.Writer.WriteString(fmt.Sprintf("logged in successfully! %s\n", user.Username))
}

func getInfo(c *gin.Context) {
	info, ok := c.Keys["claims"].(*Claims)
	if !ok {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"Message": "internal server error"})
	}
	username := info.Username
	rights, ok := RolesMap[users[username].UserRole]
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"Message": "Unauthorized, invalid role"})
		return
	}

	if rights[0] != WelcomeRight {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"Message": "Unauthorized"})
		return
	}

	if !ok {
		c.Writer.Write([]byte("user not found"))
		return
	}
	c.Writer.Write([]byte(fmt.Sprintf("Welcome %s", info.Username)))
}

func authMiddleware(c *gin.Context) {
	cookie, err := c.Request.Cookie("token")
	if err != nil {
		if err == http.ErrNoCookie {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"Message": "Unauthorized"})
			c.Abort()
			return
		}

		c.Writer.WriteHeader(http.StatusBadRequest)
	}

	tokenString := cookie.Value

	claims := &Claims{}

	tkn, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (any, error) {
		return jwtKey, nil
	})

	if err != nil {
		if err == jwt.ErrSignatureInvalid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"Message": "Unauthorized"})
			return
		}
		c.Writer.WriteHeader(http.StatusBadRequest)
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"Message": "Bad request", "error": err.Error()})
		return
	}
	if !tkn.Valid {
		// c.Writer.WriteHeader(http.StatusUnauthorized)
		// c.Abort()
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"Message": "Unauthorized"})
		return
	}
	if c.Keys == nil {
		c.Keys = map[string]any{}
	}
	c.Keys["claims"] = claims
	c.Next()
}

func setupRouter() *gin.Engine {
	// Disable Console Color
	// gin.DisableConsoleColor()
	r := gin.Default()

	// Ping test
	r.GET("/ping", func(c *gin.Context) {
		c.String(http.StatusOK, "pong")
	})

	r.POST("/login", login)

	g := r.Group("/v1")
	g.Use(authMiddleware)

	g.GET("/GetInfo", getInfo)

	return r
}

func main() {
	r := setupRouter()
	// Listen and Server in 0.0.0.0:8080
	r.Run(":8080")
}
