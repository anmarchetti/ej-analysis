namespace easyJet.Holiday.IntegrationTests.Infrastructure.Repeat
{
    public class RepeatDecorator<TOut>
    {
        private int CurrentIteration { get; set; }
        private int Repeat { get; set; }
        private RepeatDecorator() { }
        private RepeatDecorator(int repeat) { Repeat = repeat; }
        public static RepeatDecorator<TOut> Create() => new(1);

        public async Task<TOut> Execute(Func<Task<TOut>> f)
        {
            TOut? result = default;

            try
            {
                result = await f.Invoke();
            }
            catch (Exception e)
            {
                CurrentIteration++;
                if (CurrentIteration < Repeat)
                    result = await Execute(f);
            }
            return result;
        }

        public RepeatDecorator<TOut> RepeatTimes(int repeat)
        {
            if (repeat < 1)
                throw new ArgumentException("Number of repeats can not be less than 1");
            Repeat = repeat;
            return this;
        }
    }
}
