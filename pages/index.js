// pages/index.js
export default function Home() {
    return (
      <div className="min-h-screen bg-ftm-night flex items-center justify-center">
        <p className="text-ftm-mut">Redirecting...</p>
      </div>
    );
  }
  
  export async function getServerSideProps() {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }