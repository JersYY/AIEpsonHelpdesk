import api from './api'

const uploadImage = async (file) => {

    const formData = new FormData()

    formData.append('file', file)

    return api.post(
        '/files/upload',
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }
    )
}

export default {
    uploadImage
}