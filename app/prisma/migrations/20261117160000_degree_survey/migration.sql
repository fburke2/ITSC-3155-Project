CREATE TABLE `DegreeSurvey` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `school` VARCHAR(255) NOT NULL,
    `degree` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DegreeSurveyClass` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `degreeSurveyId` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `credits` DECIMAL(5, 1) NOT NULL,
    `description` TEXT NULL,
    PRIMARY KEY (`id`),
    INDEX `DegreeSurveyClass_degreeSurveyId_idx` (`degreeSurveyId`),
    CONSTRAINT `DegreeSurveyClass_degreeSurveyId_fkey`
        FOREIGN KEY (`degreeSurveyId`) REFERENCES `DegreeSurvey` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
