
# Share a Meal API Quinn Verschoor

This project was made for school and the get a deeper understanding of HTTP and how an API is made.

## API URL
The API is deployed on railway and can be accessed via this link: https://groovy-hot-production.up.railway.app/

## ABOUT THE API
This API can be used to:
Create, update, retrieve and delete users
Create, retrieve and delete meals
Login a user with JWT Token

## Projects used for the API
The projects uses the following open source projects.
- Express
- Node.js

## API Endpoints
### Login endpoint:

- Login User POST(/api/auth/login)
### User endpoints:

- Register user POST(/api/user)
- Retrieve users GET(/api/user) Use a maximum of 2 queries to filter result
- Gets the personal profile of the user GET(/api/user/profile)
- Gets user by ID GET(/api/user/:userId)
- Edit user by ID PUT(/api/user/:userId)
- Delete a user by ID DELETE(/api/user/:userId)
### Meal endpoints:

- Add a meal POST(/api/meal)
- Update a mealPUT(/api/meal/:mealId)
- Gets meals GET(/api/meal)
- Gets a meal by ID GET(/api/meal/:mealId)
- Deletes a meal by ID DELETE(/api/meal/:mealId)

## How to install

```
npm i
```
```
npm run dev
```
or
```
nodemon
```
