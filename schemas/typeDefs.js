

const typeDefs = `#graphql
 scalar DateTime


 type LoginInfo {
    ip: String
    location: String
    device: String
    long: Float
    lat: Float
    suspicious: Boolean
    timestamp: String
  }
 type User {
    id: ID!
    email: String!
    username: String
    isAdmin: Boolean!
    createdAt: String
    lastLogin: LoginInfo
  }
   type AuthPayload {
    token: String!
    user: User!
  }  

 type Comment {
    id: ID!
    content: String!
    author: User!
    createdAt: DateTime
    updatedAt: DateTime
  }
  
type Product {
    id: ID!
    name: String!
    price: Float!
    description: String!
    image: String!
    createdAt: DateTime
    updatedAt: DateTime
    reviews: [Review!]!
    reviewsCount : Int!
  }
  type CartItem {
    product: Product!
    quantity: Int!
  }

  type Cart {
    id: ID!
    user: User!
    items: [CartItem!]!
    createdAt: DateTime
    updatedAt: DateTime
  }  
   
  type Bookmark{
    id: ID!
    user: User!
    product: Product!
    createdAt: DateTime
    updatedAt: DateTime
    }

  type Todo {
    id: ID!
    name: String!
    title: String
    age: Int
    bio: String
    company: String
    experience: Int
    description: String
    address: String
    createdBy: User!
    createdAt: DateTime
    updatedAt: DateTime

  }
  
  type Review {
    id: ID!
    product: Product!
    user: User!
    rating: Int!
    comment: String
    createdAt: DateTime
    updatedAt: DateTime
  }
    
  

  type Query {
    me: User
    users: [User!]!
    todosByUser(userId: ID!): [Todo!]!
    todos: [Todo!]!
    todo(id: ID!): Todo
    commentFeed: [Comment!]!
    myComments: [Comment!]!
    allComments: [Comment!]!
    products: [Product!]!
    product(id: ID!): Product
    cart: Cart
    cartItemByProductId(productId: ID!): CartItem
    bookmarks : [Bookmark!]!
    bookmarksGroupedByUser : [[Bookmark!]!]!
    reviewsByProduct(productId: ID!): [Review!]!

  }


  type Mutation {

  signup(email: String!, password: String!, username : String!, isAdmin: Boolean): AuthPayload!

  login(email: String!, password: String!): AuthPayload!

    addTodo(
      name: String!
      title: String
      age: Int
      bio: String
      company: String
      experience: Int
      address: String
      description: String): Todo!

    updateTodo(
      id: ID!
      name: String
      title: String
      age: Int
      bio: String
      company: String
      experience: Int
      address: String
      description: String): Todo!


    deleteTodo(id: ID!): Boolean!
    deleteUser(id: ID!): Boolean!

    addComment(content: String!): Comment!
    updateComment(id: ID!, content: String!): Comment!
    deleteComment(id: ID!): Boolean!

    addProduct(
      name: String!
      price: Float!
      description: String!
      image: String!): Product!
    addToCart(productId: ID!, quantity: Int!): Cart!
    removeFromCart(productId: ID!, quantity: Int!): Cart!
    addBookmark(productId: ID!): Bookmark!
    removeBookmark(productId: ID!): Boolean!

    addReview(productId: ID!, rating: Int!, comment: String): Review!
    updateReview(id: ID!, rating: Int, comment: String): Review!
    deleteReview(id: ID!): Boolean!
  
  }
`;

export default typeDefs;