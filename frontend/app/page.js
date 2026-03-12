import Link from 'next/link';

export default function HomePage() {
  return (
    <div className='hero-section'>
      <div className='hero-background'></div>

      <div className='hero-content'>
        <div className='logo-container'>
          <div className='logo-icon'>⚗️</div>
        </div>

        <h1 className='hero-title'>
          Dr. Essa Laboratory
          <br />
          <span style={{ fontSize: '0.6em', color: '#00d4ff' }}>
            Diagnostic Lab Simulator
          </span>
        </h1>

        <p className='hero-subtitle'>
          Simulate diagnostic laboratory operations and optimize queue
          management
        </p>

        <div className='cta-buttons'>
          <Link href='/queue/mm1' className='btn-primary-custom'>
            🚀 Start Simulation
          </Link>
          <a href='#features' className='btn-secondary-custom'>
            📚 Learn More
          </a>
        </div>

        <div className='features' id='features'>
          <div className='feature-card'>
            <div className='feature-icon'>📊</div>
            <div className='feature-title'>Queue Analysis</div>
            <div className='feature-description'>
              Analyze different queueing models: M/M/1, M/G/1, and G/G/1
            </div>
          </div>

          <div className='feature-card'>
            <div className='feature-icon'>📈</div>
            <div className='feature-title'>Real Metrics</div>
            <div className='feature-description'>
              Calculate wait times, queue lengths, and system utilization
            </div>
          </div>

          <div className='feature-card'>
            <div className='feature-icon'>⚙️</div>
            <div className='feature-title'>Optimization</div>
            <div className='feature-description'>
              Optimize lab throughput and improve patient experience
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
