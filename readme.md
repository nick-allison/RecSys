# Screen Genius
> *A Comprehensive Recommender System Using Netflix Prize Data*

![Project Header](media/logo.png)

---

## Table of Contents
1. [Introduction](#introduction)  
2. [Toy Models](#toy-models)  
   - [SVD Model](#svd-model)  
   - [NCF Model](#ncf-model)  
   - [Two-Tower Model](#two-tower-model)  
3. [Data](#data)  
4. [Visualization Notebook](#visualization-notebook)  
5. [Frontend](#frontend)  
6. [Setup and Installation](#setup-and-installation)  
7. [Usage](#usage)  
8. [Project Structure](#project-structure)  
9. [Contributing](#contributing)  
10. [License](#license)  
11. [Contact](#contact)

---

## Introduction
This project presents a **comprehensive recommender system** based on the [Netflix Prize data](https://www.kaggle.com/datasets/netflix-inc/netflix-prize-data). We initially explore three popular approaches to recommendation systems—**Singular Value Decomposition (SVD)**, **Neural Collaborative Filtering (NCF)**, and a **Two-Tower architecture**—as “toy models.”

Building on these, we have developed a **deployed web application** available at https://recsys-41460.web.app/. The user can rate movies and click "Submit" to get personalized recommendations. This process may take some time on the deployed version (as it runs on a CPU on Google Cloud Run), but can run very quickly.  On an M1 Mac, for example, results are generated in about 15 seconds.

The final production model uses a **two-stage Two-Tower approach** to handle cold-start scenarios efficiently:
1. **Model 1**: Produces a 16-dimensional vector for each of the 970 popular movies, using semantic information from the movie title and the movie’s release date.
![Model 1](media/model1.png)
2. **Model 2**: Takes user ratings for up to 16 movies and constructs a 16×16 2D array by multiplying each selected movie’s 16D vector by the user’s adjusted rating for that movie. This 2D array is then fed into a CNN-based Two-Tower model that outputs a user embedding.
![Model 2](media/model2.png)

If a user rates more than 16 movies, 16 are randomly chosen. If fewer than 16 are rated, the blank spaces are filled with zeros.  This ensures that user side input to model 2 is always shape 16x16.

Once the user embedding is generated, it is used to predict scores for all 970 movies. The system responds with the top 10 highest predicted ratings and the 10 lowest predicted ratings, displayed to the user via a **Vite + React** frontend.

We provide the entire pipeline—from data visualization and exploration, to model building and training, to deployment in a Docker container on Google Cloud Run with a **FastAPI** backend, to a **Firebase**-hosted frontend.

---

## Toy Models

### SVD Model
- **Description**: Implements a matrix-factorization approach using the Surprise library.
- **Notebook**: [SVD.ipynb](toy_models/svd/svd.ipynb)
- **Features**:
  - Learns latent factors from user-item interactions.
  - Scalable solution for large rating matrices.
  - Supports user-based and item-based predictions.

### NCF Model
- **Description**: Implements an NCF model using the LibRecommender library.
- **Notebook**: [NCF.ipynb](toy_models/ncf/ncf.ipynb)
- **Features**:
  - Best Performance of the 3 toy models.
  - Easy to incorporate additional features like user demographics or item metadata.

### Two-Tower Model
- **Description**: A neural network approach that learns separate embeddings for users and items (two towers) before combining them through a similarity measure (dot product).
- **Notebook**: [TwoTower.ipynb](toy_models/two_tower/two_towers.ipynb)
- **Features**:
  - Highly scalable for large-scale recommendations.
  - Allows flexible training objectives (e.g., maximizing dot-product similarity for relevant user-item pairs).
  - Easy to deploy for real-time recommendations.

---

## Data
- **Source**: [Netflix Prize data](https://www.kaggle.com/datasets/netflix-inc/netflix-prize-data)
- **Description**: The dataset contains user ratings for various movies. It consists of several million ratings, making it ideal for testing the performance and scalability of recommender systems.
- **Usage**:
  - **Ensure** you have downloaded and extracted the dataset locally or in your Google Drive (if running on Colab).
  - **Path updates**: Modify the data paths in the notebooks to point to the directory where you’ve stored the files.

*Note*: The dataset usage must comply with its [license and terms](https://www.kaggle.com/datasets/netflix-inc/netflix-prize-data/rules).

---

## Visualization Notebook
- **Notebook**: [Visualization.ipynb](data_visualization.ipynb)
- **Features**:
  - Exploratory Data Analysis (EDA) for user rating distributions, movie popularity trends, etc.

---

## Frontend

- **Description**: A **Vite + React** application enabling users to:
  - Search for movies from a curated set of ~970 popular titles (with posters).
  - Rate any movie on a 5-star scale directly in the interface.
  - Submit ratings to a backend API (FastAPI, either locally or on the cloud).
  - Receive **top 10** highest-scored recommendations and **10 lowest** scored items.

- **Deployment**:
  - Currently deployed on **Firebase** at [https://recsys-41460.web.app/](https://recsys-41460.web.app/).  
  - When users click “Submit,” the backend route is called (hosted on Google Cloud Run by default).  

- **Local Development**:
  - Inside the `frontend` folder, install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```
  - Then run the local dev server:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
  - The app typically spins up at `http://localhost:5173` (depending on your Vite config).
  - Modify the `fetch` URL in the frontend code (`App.jsx`) if you want to point to a different API endpoint than the deployed one.

---

## Google Run Container

- **Description**: The recommendation API is containerized via Docker and deployed on **Google Cloud Run**. It’s a **CPU-only** service, which can take up to **90 seconds** to generate the predictions for a user with many ratings (especially if the service is cold-starting).
- **Performance**:
  - On **Google Cloud Run (CPU only)**: The recommendation computation may take up to 90 seconds if the service is scaling from zero or handling large input.
  - On an **M1 Mac** (locally, with Docker or direct Python): Predictions typically finish in about **15 seconds** given the same data subset and model.  
- **Usage**:
  - The deployed endpoint is invoked by the Vite + React frontend hosted on Firebase.  
  - You can also call it directly by sending a `POST` request to the Cloud Run URL (as shown in `handleSubmit` in `App.jsx`), passing JSON data of the form:
    ```json
    {
      "user_ratings": [
        { "movie_id": 123, "rating": 5 },
        { "movie_id": 456, "rating": 2 },
        ...
      ]
    }
    ```
  - The response returns two arrays, `top_10` and `bottom_10`, each containing `[movie_id, predicted_rating]` pairs.

---

## Setup and Installation

1. **Local or Google Colab (Toy Models and Visualization)**
   - You can download any of the toy model notebooks (SVD, NCF, Two-Tower) or the visualization notebook to run locally or in [Google Colab](https://colab.research.google.com/).  
   - Make sure you **have the Netflix Prize dataset in your environment** (for instance, in your Google Drive) and **update the paths** at the beginning of each notebook to point to your dataset files.  
   - These notebooks work best in Colab because the environment already has many of the needed packages installed. If you run locally, you’ll have to install the libraries used in the notebook (e.g., `numpy`, `pandas`, `tensorflow`, etc.)—this may cause version conflicts.  

2. **Docker Folder / Cloud Run**
   - The Docker setup (located in the `docker` folder) contains a `Dockerfile` that includes everything needed to build and run a FastAPI service for the trained recommendation model.  
   - There is **no separate `requirements.txt`** beyond the packages installed in the Docker image. All Python dependencies are defined within that Docker image.  

3. **Vite + React Frontend**
   - The frontend is built using [Vite](https://vitejs.dev/) and React. You can clone the repo, modify the code in the `frontend` folder, and run/build it locally.  

---

## Usage

You can interact with this project in **three** main ways:

1. **Run Toy Model Notebooks or Visualization in Colab (Recommended)**  
   - Download or open the notebooks (`SVD.ipynb`, `NCF.ipynb`, `TwoTower.ipynb`, and the visualization notebook) in Google Colab.  
   - Upload your Netflix dataset files (or place them in your Google Drive) and adjust the data path variables in the first cells.  
   - These notebooks demonstrate the conceptual approaches (toy models) and provide exploratory data analysis.  
   - There are **two additional notebooks** in `src` (`get_embeddings.ipynb` and `build_model.ipynb`) that build the embeddings and the final CNN-based Two-Tower model. They use a smaller subset of the Netflix data. You can expand their scope, but that’s outside the scope of this readme.

2. **Experiment with the Docker / FastAPI Service**  
   - Clone the repo and navigate to the `docker` folder.  
   - Inspect or modify `Dockerfile` and `main.py` to change how the FastAPI service is built or behaves.  
   - Build the Docker image locally:
     ```bash
     docker build -t my_recsys_image .
     docker run -p 8000:8000 my_recsys_image
     ```
   - This sets up the model API locally on port 8000. You can then send POST requests to `http://localhost:8000/recommend` with user ratings to get recommendations.

3. **Vite + React Frontend**  
   - Download or clone the repo and navigate to the `frontend` folder.  
   - Install dependencies (e.g., `npm install` or `yarn install`) and run the development server (`npm run dev` or `yarn dev`).  
   - This will spin up the frontend locally, which you can connect to your own FastAPI service or the deployed service (if you adjust the fetch URL).  

---

## Project Structure
Below is the updated layout of the project’s files and directories:

    recommender-system/
    │
    ├── toy_models/
    │   ├── svd.ipynb
    │   ├── ncf.ipynb
    │   └── two_towers.ipynb
    │
    ├── src/
    │   ├── get_embeddings.ipynb   (generates 16D movie vectors)
    │   ├── build_model.ipynb      (builds CNN-based Two-Tower model)
    │   ├── docker/                (Dockerfile + FastAPI for Cloud Run)
    │   │   ├── Dockerfile
    │   │   └── main.py
    │   └── frontend/              (Vite + React files)
    │       └── ...
    │
    ├── data_visualization.ipynb   (root-level EDA and visualization notebook)
    ├── README.md
    └── LICENSE

- **toy_models/**: Contains the “toy” notebooks for SVD, NCF, and a simple Two-Tower model.
- **src/**: Holds:
  - **get_embeddings.ipynb** and **build_model.ipynb** for generating embeddings and creating the final CNN-based Two-Tower model.
  - **docker/** with the Dockerfile and `main.py` for the FastAPI deployment to Google Cloud Run.
  - **frontend/** containing the Vite + React web app code.
- **data_visualization.ipynb**: A root-level notebook for exploratory data analysis and plotting.
- **README.md**: Project documentation.
- **LICENSE**: Project license.

---

## Contributing
Contributions to this project are welcome! Whether it’s improving documentation, adding new features, or fixing bugs:

1. Fork the repository:
   git clone https://github.com/yourusername/recommender-system.git

2. Create a new branch:
   git checkout -b feature/new-feature

3. Commit your changes:
   git commit -m "Add a new feature"

4. Push to the branch:
   git push origin feature/new-feature

5. Create a Pull Request in this repository.

---

## License
This project is licensed under the [MIT License](LICENSE). Please review the license file for more information.

---

## Contact
For questions, feedback, or collaboration, please reach out via [nicholasallison341@gmail.com](mailto:nicholasallison341@gmail.com) or open an [issue](https://github.com/nick-allison/RecSys/issues) on GitHub.

---

**Happy Recommending!**  
*Thank you for checking out this project. We hope it provides a valuable starting point for your own recommender system endeavors.*
