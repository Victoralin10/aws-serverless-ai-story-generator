import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getStory } from '../services/api';


interface IStory {
  description: string;
  title: string;
  audioURL: string;
  thumbnail: string;
}

const Story: React.FC = () => {
  const id = useParams<{ id: string }>().id as string;

  const [story, setStory] = useState<IStory | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const storyData = await getStory(id);
      setStory(storyData);
    };

    fetchData();
  }, [id]);

  return (
    <div className="relative isolate overflow-hidden bg-gray-900">
      <img
        src="https://images.unsplash.com/photo-1519791883288-dc8bd696e667?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2830&q=80&blend=111827&sat=-100&exp=30&blend-mode=multiply"
        alt=""
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]">
        <svg className="relative left-[calc(50%-11rem)] -z-10 h-[21.1875rem] max-w-none -translate-x-1/2 rotate-[30deg] sm:left-[calc(50%-30rem)] sm:h-[42.375rem]" viewBox="0 0 1155 678">
          <path
            fill="url(#45de2b6b-92d5-4d68-a6a0-9b9b2abad533)"
            fillOpacity=".2"
            d="M317.219 518.975L203.852 678 0 438.341l317.219 80.634 204.172-286.402c1.307 132.337 45.083 346.658 209.733 145.248C936.936 126.058 882.053-94.234 1031.02 41.331c119.18 108.451 130.68 295.337 121.53 375.223L855 299l21.173 362.054-558.954-142.079z"
          />
          <defs>
            <linearGradient id="45de2b6b-92d5-4d68-a6a0-9b9b2abad533" x1="1155.49" x2="-78.208" y1=".177" y2="474.645" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9089FC" />
              <stop offset={1} stopColor="#FF80B5" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-24">
          {story && (<div className="text-left">
            <div className="relative flex items-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl Handlee">{story.title}</h1>
              <img height={256} width={256} src={story.thumbnail} className="opacity-80 mx-auto rounded-lg shadow-sm shadow-gray-300" alt='story representation' />
            </div>
            <div>
              <audio controls className="mx-auto my-7 w-full" src={story.audioURL}>
                Your browser does not support the
                <code>audio</code> element.
              </audio>
            </div>
            {story.description.split('\n\n').map((item: string) => (
              <p key={item} className="mt-6 text-lg leading-8 text-gray-300">{item}</p>
            ))}
          </div>)}
          {!story && (<div className="text-left">
            <div className="relative flex items-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl Handlee">Loading...</h1>
            </div>
          </div>)}
        </div>
      </div>
      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
        <svg className="relative left-[calc(50%+3rem)] h-[21.1875rem] max-w-none -translate-x-1/2 sm:left-[calc(50%+36rem)] sm:h-[42.375rem]" viewBox="0 0 1155 678">
          <path
            fill="url(#ecb5b0c9-546c-4772-8c71-4d3f06d544bc)"
            fillOpacity=".2"
            d="M317.219 518.975L203.852 678 0 438.341l317.219 80.634 204.172-286.402c1.307 132.337 45.083 346.658 209.733 145.248C936.936 126.058 882.053-94.234 1031.02 41.331c119.18 108.451 130.68 295.337 121.53 375.223L855 299l21.173 362.054-558.954-142.079z"
          />
          <defs>
            <linearGradient id="ecb5b0c9-546c-4772-8c71-4d3f06d544bc" x1="1155.49" x2="-78.208" y1=".177" y2="474.645" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9089FC" />
              <stop offset={1} stopColor="#FF80B5" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

export default Story;
