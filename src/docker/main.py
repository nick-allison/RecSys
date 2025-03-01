from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple
import pandas as pd
import numpy as np
import random
import tensorflow as tf

# Constant used to adjust ratings
OFFSET = 3.687599378308004

# ----- 1. Load Movie Embeddings -----
# movie_embeddings.csv must have columns: feature_1, feature_2, ..., feature_16, id
EMBEDDINGS_PATH = "movie_embeddings.csv"
try:
    df_embeddings = pd.read_csv(EMBEDDINGS_PATH, sep=",")  # adjust sep if needed
except Exception as e:
    raise RuntimeError(f"Error loading {EMBEDDINGS_PATH}: {e}")

# Build a dictionary: movie_id -> 16-dim numpy array
embedding_dict = {}
for row in df_embeddings.itertuples(index=False):
    # Adjust column names if necessary
    vec = np.array([
        row.feature_1, row.feature_2, row.feature_3, row.feature_4,
        row.feature_5, row.feature_6, row.feature_7, row.feature_8,
        row.feature_9, row.feature_10, row.feature_11, row.feature_12,
        row.feature_13, row.feature_14, row.feature_15, row.feature_16
    ], dtype=np.float32)
    movie_id = row.id
    embedding_dict[movie_id] = vec

# List of all available movie IDs
all_movie_ids = list(embedding_dict.keys())

# ----- 2. Load Pre-trained Model from model.keras -----
try:
    model = tf.keras.models.load_model("model.keras")
    print("Model loaded successfully from model.keras")
except Exception as e:
    raise RuntimeError(f"Error loading model.keras: {e}")

# ----- 3. Helper Functions -----
def build_user_matrix(user_ratings: List[Tuple[int, float]]) -> np.ndarray:
    """
    Given a list of (movie_id, rating) pairs,
    build a 16x16 user matrix where each row is:
      movie_embedding * (rating - OFFSET).
    If there are more than 16 ratings, randomly sample 16.
    If fewer than 16, fill remaining rows with zeros.
    """
    if len(user_ratings) > 16:
        user_ratings = random.sample(user_ratings, 16)
    user_matrix = np.zeros((16, 16), dtype=np.float32)
    for idx, (m_id, rating) in enumerate(user_ratings[:16]):
        adjusted_rating = rating - OFFSET
        emb_vec = embedding_dict.get(m_id, np.zeros((16,), dtype=np.float32))
        row_vec = emb_vec * adjusted_rating
        user_matrix[idx] = row_vec
    return user_matrix

def get_movie_vector(movie_id: int) -> np.ndarray:
    """
    Retrieve the 16-dimensional vector for the given movie_id.
    If not found, returns a zero vector.
    """
    return embedding_dict.get(movie_id, np.zeros((16,), dtype=np.float32))

# ----- 4. Pydantic Models for Request/Response -----
class UserRating(BaseModel):
    movie_id: int
    rating: float

class RecommendRequest(BaseModel):
    user_ratings: List[UserRating]

class RecommendResponse(BaseModel):
    top_10: List[Tuple[int, float]]
    bottom_10: List[Tuple[int, float]]

# ----- 5. FastAPI App Setup -----
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ['*'],
    allow_credentials = True,
    allow_methods = ['*'],
    allow_headers = ['*'],
)

@app.get("/")
def home():
    return {"message": "Welcome to the Movie Recommendation API!"}

@app.post("/recommend", response_model=RecommendResponse)
def recommend_movies(req: RecommendRequest):
    """
    Accepts a list of user ratings, builds a 16x16 user matrix (zeroing out 
    the target movie's rating in the user vector for each training sample), and 
    for every movie not rated by the user, uses the loaded model to predict the rating.
    Returns top 10 highest and bottom 10 lowest predicted ratings.
    """
    # Validate input
    user_ratings = [(ur.movie_id, ur.rating) for ur in req.user_ratings]
    if not user_ratings:
        raise HTTPException(status_code=400, detail="No user ratings provided.")
    rated_ids = {m_id for (m_id, _) in user_ratings}
    
    # Build user representation (16x16 matrix)
    user_matrix = build_user_matrix(user_ratings)
    # Expand dims to shape (1, 16, 16) as required by the model
    user_input = np.expand_dims(user_matrix, axis=0)
    
    predictions = []
    # For each movie not already rated by the user:
    for m_id in all_movie_ids:
        if m_id in rated_ids:
            continue
        item_vector = get_movie_vector(m_id)
        # Expand dims to shape (1, 16)
        item_input = np.expand_dims(item_vector, axis=0)
        # Call the loaded model; adjust the input list if your model requires a different signature
        pred_array = model.predict([user_input, item_input])
        pred_rating = pred_array[0][0]
        predictions.append((m_id, pred_rating))
    
    if not predictions:
        return RecommendResponse(top_10=[], bottom_10=[])
    
    # Sort predictions descending by predicted rating
    predictions.sort(key=lambda x: x[1], reverse=True)
    top_10 = predictions[:10]
    bottom_10 = sorted(predictions[-10:], key=lambda x: x[1])
    
    return RecommendResponse(top_10=top_10, bottom_10=bottom_10)

# ----- For local testing, run Uvicorn if executed directly -----
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
