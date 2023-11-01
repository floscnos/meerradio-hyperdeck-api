import express from "express";
import multer from "multer";
import {
    deleteClip,
    getClips, getDiskInfo,
    getStatus,
    setClip,
    setPlay,
    setStop,
    toggleLoop,
    toggleSingleClip,
    uploadClip
} from "./hyperdeck-controller.js";


const apiRouter = express.Router();

apiRouter.get('/', (req, res) => {
    res.send("hello world from api");
})

apiRouter.get('/status', getStatus);
apiRouter.get('/diskinfo', getDiskInfo);

apiRouter.get('/play', setPlay);
apiRouter.get('/stop', setStop);
apiRouter.get('/loop', toggleLoop);
apiRouter.get('/singleClip', toggleSingleClip);

apiRouter.get('/clips', getClips);
apiRouter.get('/setClip/:clipId', setClip);

apiRouter.delete('/clips/:filename', deleteClip);

const storage = multer.diskStorage({
    destination: (req, res, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})
const upload= multer({storage: storage});
apiRouter.post('/clips', upload.single('clip'), uploadClip)

export default apiRouter;