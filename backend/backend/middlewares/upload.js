const fs = require("fs");
const path = require("path");
const multer = require("multer");
const HttpError = require(
  "../utils/httpError",
);

const productsDirectory =
  path.join(
    __dirname,
    "../uploads/products",
  );

fs.mkdirSync(
  productsDirectory,
  {
    recursive: true,
  },
);

const storage =
  multer.diskStorage({
    destination(
      req,
      file,
      callback,
    ) {
      callback(
        null,
        productsDirectory,
      );
    },

    filename(
      req,
      file,
      callback,
    ) {
      const extension =
        path
          .extname(
            file.originalname,
          )
          .toLowerCase();

      const filename =
        `${Date.now()}-${Math.round(
          Math.random() * 1e9,
        )}${extension}`;

      callback(
        null,
        filename,
      );
    },
  });

const upload = multer({
  storage,

  limits: {
    fileSize:
      5 * 1024 * 1024,

    /*
     * Maximum global par requête.
     */
    files: 10,
  },

  fileFilter(
    req,
    file,
    callback,
  ) {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedMimeTypes.includes(
        file.mimetype,
      )
    ) {
      return callback(
        new HttpError(
          400,
          "Formats autorisés : JPG, PNG et WEBP.",
        ),
      );
    }

    return callback(
      null,
      true,
    );
  },
});

/*
 * upload.any() évite LIMIT_UNEXPECTED_FILE
 * si une ancienne page envoie encore :
 * - images
 * - upload_images
 * - image
 *
 * La limite globale reste fixée à 10.
 */
const uploadArticleImages =
  upload.any();

module.exports = upload;
module.exports.uploadArticleImages =
  uploadArticleImages;
