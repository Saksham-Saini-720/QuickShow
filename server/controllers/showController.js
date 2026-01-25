import axios from 'axios'
import Movie from '../models/Movie.js'
import Show from '../models/Show.js'

// api to get now playing movies from TMDB api
export const getNowPlayingMovies = async (req, res)=>{
    try {
        const {data} = await axios.get('https://api.themoviedb.org/3/movie/now_playing', {
            headers : {Authorization : `Bearer ${process.env.TMDB_API_KEY}`}
        })

        const movies = data.results
        res.json({success : true, movies : movies})
    } catch (error) {
        console.log(error);
        res.json({success : false, message : error.message})        
    }
}

//api to add a new show to the Database
export const addShow = async(req, res)=>{
    try {
        const {movieId, showInput, showPrice} = req.body

        let movie = await Movie.findById(movieId)

        if(!movie){
            // fetch movies details and credits from tmdb api
            const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                    headers : {Authorization : `Bearer ${process.env.TMDB_API_KEY}`}
                }),
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
                    headers : {Authorization : `Bearer ${process.env.TMDB_API_KEY}`}
                })
            ])

            const movieApiData = movieDetailsResponse.data
            const movieCreditsData = movieCreditsResponse.data

            const movieDetails = {
                _id : movieId,
                title : movieApiData.title,
                overview : movieApiData.overview,
                poster_path : movieApiData.poster_path,
                backdrop_path : movieApiData.backdrop_path,
                release_date : movieApiData.release_date,
                original_language : movieApiData.original_language,
                tagline : movieApiData.tagline || "",
                genres : movieApiData.genres,
                casts : movieApiData.cast,
                vote_average :movieApiData.vote_average,
                runtime : movieApiData.runtime
            }

            // add movie to db
            movie = await Movie.create(movieDetails)
        }

        const showToCreate = [];
        showInput.forEach(show => {
            const showDate = show.date
            show.times.forEach(time => {
                const dateTimeString = `${showDate}T${time}`
                showToCreate.push({
                    movie : movieId,
                    showDateTime : new Date(dateTimeString),
                    showPrice,
                    occupiedSeats : {}
                })
            })
        });

        if(showToCreate.length > 0){
            await Show.insertMany(showToCreate)
        }

       res.json({success : true, message : "Show Added Successfully"})
        
    } catch (error) {
        console.log(error);
        res.json({success : false, message : error.message})
    }
}

// api to get all shows fron db
export const getShows = async (req, res) =>{
    try{
        const shows = await Show.find({showDateTime : {$gte : new Date()}}).populate("movie").sort({showDateTime : 1})

        //filtre unique shows
        const uniqueShows = new Set(shows.map(show => show.movie))

        res.json({success : true, shows: Array.from(uniqueShows)})

    } catch (error) {
        console.log(error);
        res.json({success : false, message : error.message})
    }
}

// api to get a single show from the database
export const getShow = async(req, res) =>{
    try {
        const {movieId} = req.params;
        //get all upcoming show for the movie 
        const shows = await Show.find({movie : movieId, showDateTime : {$gte : new Date()}})

        const movie = await Movie.findById(movieId)
        const dateTime = {}

        shows.forEach(show => {
            const date = show.showDateTime.toISOString().split("T")[0];
            if(!dateTime[date]){
                dateTime[date] = []
            }
            dateTime[date].push({time : show.showDateTime, showId : show._id})            
        })

        res.json({success : true, movie, dateTime})
    } catch (error) {
        console.log(error);
        res.json({success : false, message : error.message})
    }
}