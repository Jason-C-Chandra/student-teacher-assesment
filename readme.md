# Teacher-Student Task Submission Jason Christopher Chandra

API Solution for teacher student task using TypeScript, MySQL, and TypeORM.

## Running Locally

### Prerequisites
- Docker
- Node.js (v18 or later)
- npm 

### Setup & Run
1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo.git
   cd your-repo
   ```
2. Start MySQL using Docker:
   ```sh
   docker-compose up -d
   ```
3. Install dependencies:
   ```sh
   npm install
   ```
4. Start the server:
   ```sh
   npm run dev
   ```

## Database Configuration
The database is configured with the following credentials:
- **Host:** localhost
- **Port:** 3306
- **Username:** user
- **Password:** teacher_student_system_password
- **Database Name:** teacher_student_system

## API Endpoints
| Method | Endpoint          | Description           |
|--------|------------------|----------------------|
| GET    | `/teachers`      | Get all teachers     |
| POST   | `/teachers`      | Create a teacher     |
| GET    | `/students`      | Get all students     |
| POST   | `/students`      | Create a student     |

## License
MIT

