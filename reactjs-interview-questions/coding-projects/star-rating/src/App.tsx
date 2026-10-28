import StarRating from "./components/StarRating";
import {ratings} from "./data/rating";
import "./App.css";

function App() {
  return (
    <div className="app">
      <h1>Star rating</h1>
      <StarRating></StarRating>

      <h2>Reviews</h2>
      {ratings.map((reivew) => (
        <div key={reivew.id}>
          <strong>{reivew.name}</strong>
          <span> - {reivew.rating} {`\u2605`}</span>
        </div>
      )  
      )}
    </div>
  )
}

export default App;