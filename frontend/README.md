# AkonProject (Smart Crop Recommendation System)

![AkonProject Screenshot](/sen-grp-2.vercel.app_.png)

AkonProject is a machine learning–based expert system that helps farmers choose the most suitable crop based on soil composition and environmental conditions.

Instead of relying on a rule engine, AkonProject uses trained models to make predictions directly from data. Farmers input key parameters about their land, and the system returns crop recommendations ranked by confidence.

The system is built with a Next.js frontend and a Django Ninja backend.

---

## What it does

AkonProject takes structured agricultural data such as soil nutrients and climate conditions, runs it through trained machine learning models, and suggests the best crops to plant.

---

## Example input

Farmers provide values like:

* Nitrogen (N), Phosphorus (P), Potassium (K) levels
* Temperature
* Humidity
* Soil pH
* Rainfall

---

## Example output

* Recommended crop
* Model used for prediction
* Model accuracy
* Confidence score
* Ranked list of alternative crops

---

## How it works

1. The user inputs soil and environmental data
2. The backend processes and normalizes the data
3. Two models are used for prediction:

   * Random Forest
   * Neural Network
4. The system evaluates outputs and ranks possible crops
5. Results are returned with confidence scores

---

## Tech stack

Frontend

* Next.js

Backend

* Django Ninja

Machine Learning

* Random Forest
* Neural Network

---

## Why this approach

Agricultural decisions depend heavily on data. Instead of hardcoding rules, AkonProject learns patterns directly from datasets.

* Random Forest provides strong baseline accuracy and interpretability
* Neural Networks capture more complex relationships in the data

Using both improves reliability and flexibility.

---

## Disclaimer

This system provides recommendations based on trained models and available data.

It should be used as a decision support tool, not a guarantee of yield or outcome.

---

## Future work

* More training data across different regions
* Better model tuning and ensemble strategies
* Real-time weather integration
* Mobile-first experience for farmers
* Offline support for low-connectivity areas

---

## Authors

Built as part of a final year project.
