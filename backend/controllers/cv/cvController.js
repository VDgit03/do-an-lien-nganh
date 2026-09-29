import {
    createCVService, 
    getMyCVsService, 
    getCVByIdService, 
    updateCVService, 
    deleteCVService
} from "../../services/cv/cvService.js";


export const createCV = async (
    req,
    res
) => {

    try {

        const userId = req.user.id;

        const data = req.body;


        const cv = await createCVService(
            userId,
            data
        );


        return res.status(201).json({

            success: true,

            message:
                "Lưu CV thành công",

            data: cv

        });


    } catch (error) {

        console.error(
            "CREATE CV ERROR:",
            error
        );

        if (
            error.message
        ) {

            return res.status(400).json({

                success: false,

                message:
                    error.message

            });
        }

        return res.status(500).json({

            success: false,

            message:
                "Có lỗi xảy ra khi lưu CV"

        });
    }
};


// lấy cv
export const getMyCVs = async (
    req,
    res
) => {

    try {

        const userId = req.user.id;

        const cvs = await getMyCVsService(
            userId
        );

        return res.status(200).json({

            success: true,

            cvs

        });

    } catch (error) {

        console.error(
            "GET MY CVS ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Không thể lấy danh sách CV"

        });
    }
};


// xóa cv
export const deleteCV = async (req, res) => {

    try {

        const { id } = req.params;

        const userId = req.user.id;

        const result = await deleteCVService(
            id,
            userId
        );

        res.status(200).json(result);

    } catch (error) {

        console.error(
            "Lỗi xóa CV:",
            error
        );

        res.status(400).json({
            message: error.message
        });
    }
};


// lấy cv
export const getCVById = async (
    req,
    res
) => {

    try {

        const { id } = req.params;

        const userId = req.user.id;

        const cv = await getCVByIdService(
            id,
            userId
        );


        return res.status(200).json({

            success: true,

            data: cv

        });

    } catch (error) {

        console.error(
            "GET CV BY ID ERROR:",
            error
        );

        return res.status(404).json({

            success: false,

            message:
                error.message ||
                "Không tìm thấy CV"

        });

    }

};


// update cv
export const updateCV = async (
    req,
    res
) => {

    try {

        const { id } = req.params;

        const userId = req.user.id;

        const data = req.body;

        const cv = await updateCVService(
            id,
            userId,
            data
        );

        return res.status(200).json({

            success: true,

            message:
                "Cập nhật CV thành công",

            data: cv

        });

    } catch (error) {

        console.error(
            "UPDATE CV ERROR:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Không thể cập nhật CV"

        });

    }

};