CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `User_email_key` (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Interest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `Interest_name_key` (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Course` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `value` VARCHAR(100) NOT NULL,
    `code` VARCHAR(20) NULL,
    `name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `creditHours` DECIMAL(4, 1) NULL,
    `creditsToComplete` INTEGER NULL,
    `semesters` INTEGER NULL,
    `salary` DECIMAL(10, 2) NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'USD',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `Course_value_key` (`value`),
    UNIQUE INDEX `Course_code_key` (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SurveyResponse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `degreeGoal` VARCHAR(255) NOT NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `SurveyResponse_userId_idx` (`userId`),
    CONSTRAINT `SurveyResponse_userId_fkey`
        FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SurveyInterest` (
    `surveyResponseId` INTEGER NOT NULL,
    `interestId` INTEGER NOT NULL,
    PRIMARY KEY (`surveyResponseId`, `interestId`),
    INDEX `SurveyInterest_interestId_idx` (`interestId`),
    CONSTRAINT `SurveyInterest_surveyResponseId_fkey`
        FOREIGN KEY (`surveyResponseId`) REFERENCES `SurveyResponse` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `SurveyInterest_interestId_fkey`
        FOREIGN KEY (`interestId`) REFERENCES `Interest` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CourseSelection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `courseId` INTEGER NOT NULL,
    `selectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `CourseSelection_userId_key` (`userId`),
    INDEX `CourseSelection_courseId_idx` (`courseId`),
    CONSTRAINT `CourseSelection_userId_fkey`
        FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `CourseSelection_courseId_fkey`
        FOREIGN KEY (`courseId`) REFERENCES `Course` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
